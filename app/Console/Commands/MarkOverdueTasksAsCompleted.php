<?php

namespace App\Console\Commands;

use App\Models\CalendarEvent;
use Illuminate\Console\Command;

class MarkOverdueTasksAsCompleted extends Command
{
    protected $signature = 'tasks:mark-overdue';
    protected $description = 'Автоматически отмечает просроченные задачи как выполненные и переносит их в Историю';

    public function handle()
    {
        $now = now();

        // Находим все невыполненные задачи, у которых время уже прошло
        $overdueTasks = CalendarEvent::where('is_completed', false)
            ->where('start_at', '<', $now)
            ->get();

        foreach ($overdueTasks as $task) {
            $task->update([
                'is_completed' => true,
                'completed_at' => $task->start_at, // ставим время выполнения = время задачи
            ]);
        }

        $this->info("✅ Отмечено как выполненные: {$overdueTasks->count()} задач");
    }
}