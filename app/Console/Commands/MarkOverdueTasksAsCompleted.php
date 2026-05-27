<?php

namespace App\Console\Commands;

use App\Models\CalendarEvent;
use Illuminate\Console\Command;

class MarkOverdueTasksAsCompleted extends Command
{
    protected $signature = 'tasks:mark-overdue';
    protected $description = 'Автоматически отмечает просроченные задачи как выполненные и переносит их в Историю (и создаёт следующие повторения)';

    public function handle()
    {
        $now = now();

        $overdueTasks = CalendarEvent::where('is_completed', false)
            ->whereNotNull('end_at')
            ->where('end_at', '<=', $now)
            ->get();

        foreach ($overdueTasks as $task) {
            $notes = $task->notes ? $task->notes . "\n" : '';
            $notes .= 'Автоматически завершено';

            $task->update([
                'is_completed' => true,
                'completed_at' => $task->end_at,
                'notes'        => $notes,
            ]);

            // Единая логика повторений теперь живёт в модели
            $task->createNextOccurrence();
        }

        $this->info("✅ Отмечено как выполненные: {$overdueTasks->count()} задач");
    }
}