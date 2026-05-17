<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalendarEvent;
use App\Models\Notification as CustomNotification;
use App\Notifications\PetReminderNotification;

class SendReminders extends Command
{
    protected $signature = 'reminders:send';
    protected $description = 'Отправка напоминаний пользователям';

    public function handle()
    {
        $now = now();

        $events = CalendarEvent::where('is_completed', false)
            ->whereNotNull('reminder_minutes')
            ->where('reminder_minutes', '>=', 0) 
            ->whereNull('reminder_sent_at')
            ->get();

        $sent = 0;

        foreach ($events as $event) {
            
            if ($event->reminder_minutes == 0) {
                
                if ($event->start_at->lte($now)) {
                    $this->sendReminder($event, $sent);
                }
            } else {
                // Обычное напоминание (за X минут)
                $reminderTime = $event->start_at->copy()->subMinutes($event->reminder_minutes);
                
                if ($reminderTime->lte($now)) {
                    $this->sendReminder($event, $sent);
                }
            }
        }

        $this->info("Отправлено напоминаний: {$sent}");
    }

    private function sendReminder($event, &$sent)
    {
        $user = $event->pet->owner;

        if ($user && $user->notify_email) {
            $user->notify(new PetReminderNotification($event));
            
            CustomNotification::create([
                'user_id'  => $user->id,
                'pet_id'   => $event->pet_id,
                'event_id' => $event->id,
                'type'     => 'reminder',
                'title'    => 'Напоминание: ' . $event->title,
                'body'     => 'Задача для ' . $event->pet->name . ' в ' . $event->start_at->format('H:i'),
            ]);
            
            $event->update(['reminder_sent_at' => now()]);
            $sent++;
        }
    }
}