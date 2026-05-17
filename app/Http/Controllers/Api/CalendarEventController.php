<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\Pet;
use Illuminate\Http\Request;

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

    /**
 * Получить все события пользователя (для всех питомцев)
 */
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

        $event = $pet->events()->create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_completed' => $request->boolean('is_completed', false),
            'is_medical' => $isMedical,
            'is_all_day' => $request->boolean('is_all_day'),
            'notes' => $request->input('notes'),
            'completed_at' => $request->input('completed_at'),
            'reminder_minutes' => $request->input('reminder_minutes'),
        ]);
        /*
        // === ОТПРАВКА УВЕДОМЛЕНИЯ ===
        if (!empty($validated['reminder_minutes']) && $validated['reminder_minutes'] > 0) {
            $user = auth()->user();
            $user->notify(new \App\Notifications\PetReminderNotification($event));
        }  
        */     
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
        ]);

        $isMedical = in_array($validated['event_type'] ?? $event->event_type, ['Лекарство', 'Ветеринар', 'Укол'])
            ? true
            : ($validated['is_medical'] ?? $event->is_medical);

        $event->update([
            ...$validated,
            'is_medical' => $isMedical,
            'is_all_day' => $request->boolean('is_all_day', $event->is_all_day),
            'reminder_minutes' => $request->input('reminder_minutes', $event->reminder_minutes),
            'reminder_sent_at' => $request->has('reminder_minutes') ? null : $event->reminder_sent_at,
        ]);

        // Если изменили время напоминания — сбрасываем флаг отправки
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
     * Выполнить задачу
     */
    public function complete(Request $request, CalendarEvent $event)
    {
        $this->authorize('update', $event->pet);

        // Отмечаем текущую задачу как выполненную
        $event->update([
            'is_completed' => true,
            'completed_at' => now(),
            'notes' => $request->input('notes'),
        ]);

        // === АВТОМАТИЧЕСКОЕ СОЗДАНИЕ СЛЕДУЮЩЕЙ ЗАДАЧИ (ПОВТОР) ===
        if ($event->recurrence_rule && $event->recurrence_rule !== 'none') {
            $nextDate = $this->calculateNextDate($event->start_at, $event->recurrence_rule);

            if ($nextDate) {
                $newTask = $event->replicate(); // копируем все поля
                $newTask->start_at = $nextDate;
                $newTask->is_completed = false;
                $newTask->completed_at = null;
                $newTask->notes = null;
                $newTask->save();
            }
        }

        return response()->json([
            'message' => 'Задача выполнена',
            'event' => $event->load('creator', 'pet')
        ]);
    }

    /**
     * Вычисляет следующую дату на основе правила повтора
     */
    private function calculateNextDate(string $startAt, string $recurrence): ?string
    {
        $date = new \DateTime($startAt);

        switch ($recurrence) {
            case 'daily':
                $date->modify('+1 day');
                break;
            case 'weekdays':
                // Пропускаем выходные
                do {
                    $date->modify('+1 day');
                } while (in_array($date->format('N'), [6, 7]));
                break;
            case 'weekends':
                // Только выходные
                do {
                    $date->modify('+1 day');
                } while (!in_array($date->format('N'), [6, 7]));
                break;
            case 'weekly':
                $date->modify('+1 week');
                break;
            case 'monthly':
                $date->modify('+1 month');
                break;
            case 'yearly':
                $date->modify('+1 year');
                break;
            default:
                return null;
        }

        return $date->format('Y-m-d H:i:s');
    }
}