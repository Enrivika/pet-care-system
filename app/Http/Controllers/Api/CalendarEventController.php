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
            'title' => 'required|string|max:255',
            'event_type' => 'required|string',
            'start_at' => 'required|date',
            'end_at' => 'nullable|date|after:start_at',
            'is_recurring' => 'boolean',
            'recurrence_rule' => 'nullable|string',
            'reminder_minutes' => 'nullable|integer|min:0',
            'is_medical' => 'boolean',                    
        ]);


        $isMedical = in_array($validated['event_type'], ['Лекарство', 'Ветеринар', 'Укол'])
            ? true
            : ($validated['is_medical'] ?? false);

        $event = $pet->events()->create([
            ...$validated,
            'created_by' => auth()->id(),
            'is_completed' => false,
            'is_medical' => $isMedical,
        ]);

        return response()->json($event, 201);
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
            'title' => 'sometimes|string|max:255',
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
        ]);

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

        $event->update([
            'is_completed' => true,
            'completed_at' => now(),  // ← Добавили время выполнения
            'notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Задача выполнена',
            'event' => $event->load('creator', 'pet')  // ← Загружаем связи
        ]);
    }
}