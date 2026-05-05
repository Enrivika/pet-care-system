<?php

namespace App\Console\Commands;

use App\Jobs\SendPetReminder;
use App\Models\CalendarEvent;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendReminders extends Command
{
    protected $signature = 'reminders:send';
    protected $description = 'Отправка напоминаний о предстоящих событиях';

    public function handle()
    {
        $now = Carbon::now();

        // Берём только будущие события, у которых задано время напоминания
        $events = CalendarEvent::where('is_completed', false)
            ->where('start_at', '>', $now)
            ->whereNotNull('reminder_minutes')
            ->get();

        $sentCount = 0;

        foreach ($events as $event) {
            // Вычисляем время, когда нужно отправить напоминание
            $reminderTime = $event->start_at->copy()->subMinutes($event->reminder_minutes);

            // Если время напоминания уже наступило (или прошло)
            if ($reminderTime->lte($now)) {
                SendPetReminder::dispatch($event);
                $sentCount++;
            }
        }

        $this->info("Напоминаний отправлено: {$sentCount}");
    }
}