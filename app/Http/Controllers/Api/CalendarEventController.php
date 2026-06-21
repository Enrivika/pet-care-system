<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\Pet;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CalendarEventController extends Controller
{
    public function index(Pet $pet)
    {
        $this->authorize('view', $pet);

        return response()->json(
            $pet->events() 
                ->orderBy('start_at')
                ->with('creator')
                ->get()
        );
    }
    
    public function indexAll()
    {
        $userId = auth()->id();

        return response()->json(
            CalendarEvent::whereHas('pet', function ($query) use ($userId) {
                $query->where('owner_id', $userId);
            })
            ->orderBy('start_at')
            ->with('creator', 'pet')
            ->get()
        );
    }

    public function store(Request $request, Pet $pet)
    {
        $this->authorize('update', $pet);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'event_type' => 'required|string',
            'start_at' => 'required|date',
            'end_at' => 'nullable|date|after:start_at',
            'is_recurring' => 'boolean',
            'recurrence_rule' => 'nullable|string',
            'reminder_minutes' => 'nullable|integer|min:0',
            'is_medical' => 'boolean',
            'notes' => 'nullable|string',
            'completed_at' => 'nullable|date',
            'is_completed' => 'boolean',
        ]);


        $isMedical = in_array($validated['event_type'], ['Лекарство', 'Ветеринар', 'Укол'])
            ? true
            : ($validated['is_medical'] ?? false);

        $isAllDay = $request->boolean('is_all_day');

        // Для задач "на весь день" end_at должен быть строго на следующий день в 00:00:00.
        // Обычные задачи по умолчанию длятся 1 час (как было раньше).
        if (empty($validated['end_at'])) {
            $start = \Carbon\Carbon::parse($validated['start_at']);
            if ($isAllDay) {
                $validated['end_at'] = $start->copy()->startOfDay()->addDay();
            } else {
                $validated['end_at'] = $start->copy()->addHour();
            }
        } elseif ($isAllDay) {            
            $start = \Carbon\Carbon::parse($validated['start_at']);
            $validated['end_at'] = $start->copy()->startOfDay()->addDay();
        }

        // КРИТИЧЕСКИ ВАЖНО: если пользователь выбрал повтор — явно включаем флаг is_recurring.        
        $recurrenceRule = $validated['recurrence_rule'] ?? null;
        $isRecurring = !empty($recurrenceRule) && $recurrenceRule !== 'none';

        $event = $pet->events()->create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_completed' => $request->boolean('is_completed', false),
            'is_medical' => $isMedical,
            'is_all_day' => $isAllDay,
            'is_recurring' => $isRecurring,
            'notes' => $request->input('notes'),
            'completed_at' => $request->input('completed_at'),
            'reminder_minutes' => $request->input('reminder_minutes'),
        ]);
           
        return response()->json($event->load('pet'), 201);
    }

    public function show(CalendarEvent $event)
    {
        $this->authorize('view', $event->pet);
        return response()->json($event->load('creator', 'pet'));
    }

    public function update(Request $request, CalendarEvent $event)
    {
        $this->authorize('update', $event->pet);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'event_type' => 'sometimes|string',
            'start_at' => 'sometimes|date',
            'end_at' => 'nullable|date|after:start_at',
            'is_recurring' => 'boolean',
            'recurrence_rule' => 'nullable|string',
            'reminder_minutes' => 'nullable|integer|min:0',
            'is_completed' => 'boolean',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'is_medical' => 'boolean',
            'pet_id' => 'sometimes|integer|exists:pets,id',
        ]);
        
        if (array_key_exists('pet_id', $validated) && (int)$validated['pet_id'] !== $event->pet_id) {
            $newPet = Pet::findOrFail($validated['pet_id']);
            $this->authorize('update', $newPet);
        }

        $isMedical = in_array($validated['event_type'] ?? $event->event_type, ['Лекарство', 'Ветеринар', 'Укол'])
            ? true
            : ($validated['is_medical'] ?? $event->is_medical);
        
        $isAllDay = $request->boolean('is_all_day', $event->is_all_day);
        
        $dataToUpdate = $validated;

        $startAtChanged = array_key_exists('start_at', $validated);
        $endAtExplicitlySent = $request->has('end_at');

        if ($startAtChanged && !$endAtExplicitlySent) {
            $newStart = \Carbon\Carbon::parse($validated['start_at']);

            if ($isAllDay) {
                $dataToUpdate['end_at'] = $newStart->copy()->startOfDay()->addDay();
            } else {                
                $duration = $event->is_all_day ? 60 : $event->getDurationInMinutes();                
                $dataToUpdate['end_at'] = $newStart->copy()->addMinutes($duration);
            }
        }
        
        if ($isAllDay) {
            $startForEnd = isset($dataToUpdate['start_at'])
                ? \Carbon\Carbon::parse($dataToUpdate['start_at'])
                : $event->start_at;

            $dataToUpdate['end_at'] = $startForEnd->copy()->startOfDay()->addDay();
        }
        // КРИТИЧЕСКИ ВАЖНО: при редактировании явно вычисляем is_recurring,        
        $recurrenceRule = $validated['recurrence_rule'] ?? $event->recurrence_rule;

        $isRecurring = !empty($recurrenceRule) && $recurrenceRule !== 'none';

        $event->update([
            ...$dataToUpdate,
            'is_recurring' => $isRecurring,
            'is_medical' => $isMedical,
            'is_all_day' => $isAllDay,            
            'reminder_minutes' => $request->has('reminder_minutes')
                ? $request->input('reminder_minutes')
                : $event->reminder_minutes,
            'reminder_sent_at' => $request->has('reminder_minutes') ? null : $event->reminder_sent_at,
        ]);
        
        if ($request->has('reminder_minutes')) {
            $event->update(['reminder_sent_at' => null]);
        }        

        return response()->json($event->load('creator', 'pet'));
    }

    public function destroy(CalendarEvent $event)
    {
        $this->authorize('update', $event->pet);

        $event->delete();

        return response()->json(null, 204);
    }
    /**
     * Отметить задачу выполненной.
     *
     * Если задача повторяющаяся — автоматически создаёт следующее вхождение
     * (кроме случая, когда пользователь явно отключил повтор при завершении).
     *
     * Поддерживает параметр keep_recurring:
     * - true (по умолчанию) — повтор остаётся, следующая задача будет создана
     * - false — is_recurring и recurrence_rule сбрасываются у текущей задачи,
     *           следующее повторение не создаётся.
     */
    public function complete(Request $request, CalendarEvent $event)
    {
        $this->authorize('update', $event->pet);

        $validated = $request->validate([
            'notes'          => 'nullable|string',
            'keep_recurring' => 'sometimes|boolean',
        ]);

        $event->update([
            'is_completed' => true,
            'completed_at' => now(),
            'notes'        => $validated['notes'] ?? null,
        ]);

        // === Логика отключения повторения по желанию пользователя ===
        // По умолчанию (true) — повтор остаётся. Если фронтенд передал false — выключаем.
        $keepRecurring = $request->boolean('keep_recurring', true);

        if ($keepRecurring === false) {
            $event->update([
                'is_recurring'    => false,
                'recurrence_rule' => null,
            ]);
        }

        // Делегируем создание следующего повторения в модель.
        // Метод createNextOccurrence() сам проверит is_recurring и recurrence_rule.
        $nextEvent = $event->createNextOccurrence();

        $response = [
            'message' => 'Задача выполнена',
            'event'   => $event->load('creator', 'pet'),
        ];

        if ($nextEvent) {
            $response['nextEvent'] = $nextEvent->load('creator', 'pet');
        }

        return response()->json($response);
    }
}