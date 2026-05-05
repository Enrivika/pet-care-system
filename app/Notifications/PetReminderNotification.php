<?php

namespace App\Notifications;

use App\Models\CalendarEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PetReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public CalendarEvent $event;

    public function __construct(CalendarEvent $event)
    {
        $this->event = $event;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Напоминание: ' . $this->event->title)
            ->greeting('Здравствуйте, ' . $notifiable->name . '!')
            ->line('У вас запланировано событие для питомца ' . $this->event->pet->name . ':')
            ->line($this->event->title)
            ->line('Время: ' . $this->event->start_at->format('d.m.Y H:i'))
            ->action('Открыть в Petopia', url('/calendar'))
            ->line('Спасибо за использование Petopia!');
    }

    public function toArray($notifiable)
    {
        return [
            'event_id' => $this->event->id,
            'title' => $this->event->title,
            'pet_name' => $this->event->pet->name,
            'start_at' => $this->event->start_at->toDateTimeString(),
        ];
    }
}