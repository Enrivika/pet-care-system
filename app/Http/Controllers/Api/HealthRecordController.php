<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class HealthRecordController extends Controller
{
    public function index()
    {
        $userId = auth()->id();

        // Новые медицинские записи
        $healthRecords = HealthRecord::whereHas('pet', function ($query) use ($userId) {
            $query->where('owner_id', $userId);
        })
        ->with('pet')
        ->get()
        ->map(function ($record) {
            return [
                'id' => $record->id,
                'type' => 'health_record',
                'pet_id' => $record->pet_id,
                'pet' => $record->pet,
                'record_type' => $record->record_type,
                'title' => $record->title,
                'description' => $record->description,
                'record_date' => $record->record_date,
                'created_at' => $record->created_at,
            ];
        });

        // Старые медицинские задачи из календаря (is_medical = true)
        $medicalTasks = CalendarEvent::whereHas('pet', function ($query) use ($userId) {
            $query->where('owner_id', $userId);
        })
        ->where('is_medical', true)
        ->where('is_completed', true) // Только выполненные
        ->with('pet')
        ->get()
        ->map(function ($task) {
            return [
                'id' => $task->id,
                'type' => 'calendar_event',
                'pet_id' => $task->pet_id,
                'pet' => $task->pet,
                'record_type' => $task->event_type,
                'title' => $task->title,
                'description' => $task->notes,
                'record_date' => $task->start_at,
                'created_at' => $task->created_at,
            ];
        });

        // Объединяем и сортируем по дате (новые сверху)
        $allRecords = $healthRecords->concat($medicalTasks)
            ->sortByDesc('record_date')
            ->values();

        return response()->json($allRecords);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => 'required|exists:pets,id',
            'record_type' => 'required|in:Укол,Ветеринар,Лекарство,Другое',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'record_date' => 'required|date|before_or_equal:now',
        ]);

        $record = HealthRecord::create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return response()->json($record->load('pet'), 201);
    }

    public function show(HealthRecord $healthRecord)
    {
        $this->authorize('view', $healthRecord->pet);
        return response()->json($healthRecord->load('pet'));
    }

    public function update(Request $request, HealthRecord $healthRecord)
    {
        $this->authorize('update', $healthRecord->pet);

        $validated = $request->validate([
            'pet_id' => 'sometimes|exists:pets,id',
            'record_type' => 'sometimes|in:Укол,Ветеринар,Лекарство,Другое',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'record_date' => 'sometimes|date|before_or_equal:now',
        ]);

        $healthRecord->update($validated);

        return response()->json($healthRecord->load('pet'));
    }

    public function destroy(HealthRecord $healthRecord)
    {
        $this->authorize('update', $healthRecord->pet);
        $healthRecord->delete();

        return response()->json(null, 204);
    }
}