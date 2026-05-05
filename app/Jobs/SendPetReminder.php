<?php

namespace App\Jobs;

use App\Models\CalendarEvent;
use App\Notifications\PetReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPetReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public CalendarEvent $event;

    public function __construct(CalendarEvent $event)
    {
        $this->event = $event;
    }

    public function handle(): void
    {
        $user = $this->event->pet->owner;

        // Отправляем уведомление владельцу
        $user->notify(new PetReminderNotification($this->event));

        // Если есть члены семьи с доступом — можно отправить и им (опционально)
        foreach ($this->event->pet->shares as $share) {
            if ($share->role !== 'viewer') {
                $share->user->notify(new PetReminderNotification($this->event));
            }
        }
    }
}