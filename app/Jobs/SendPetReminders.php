<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\CalendarEvent;
use App\Notifications\PetReminderNotification;

class SendPetReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $now = now();

        // Ищем задачи, у которых наступило время напоминания
        $events = CalendarEvent::where('is_completed', false)
            ->whereNotNull('reminder_minutes')
            ->where('reminder_minutes', '>', 0)
            ->whereNull('reminder_sent_at')
            ->get();

        foreach ($events as $event) {
            $reminderTime = $event->start_at->copy()->subMinutes($event->reminder_minutes);

            // Если время напоминания уже наступило
            if ($reminderTime->lte($now)) {
                $user = $event->pet->owner;

                if ($user) {
                    // Отправляем уведомление
                    $user->notify(new PetReminderNotification($event));
                    
                    // Отмечаем, что уведомление отправлено
                    $event->update(['reminder_sent_at' => now()]);
                }
            }
        }
    }
}