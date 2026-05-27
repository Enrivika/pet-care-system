<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\CalendarEvent;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class PetReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $event;

    public function __construct(CalendarEvent $event)
    {
        $this->event = $event;
    }

    public function via($notifiable)
    {
        $channels = [];

        // Проверяем настройки пользователя
        if ($notifiable->notify_email) {
            $channels[] = 'mail';
        }
        
        if ($notifiable->notify_push) {            
            $channels[] = WebPushChannel::class;
        }
        
        //$channels[] = 'database';

        return $channels;
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Напоминание: ' . $this->event->title)
            ->greeting('Привет, ' . $notifiable->name . '!')
            ->line('Напоминаем о задаче для питомца **' . $this->event->pet->name . '**:')
            ->line('**' . $this->event->title . '**')
            ->line('Категория: ' . $this->event->event_type)
            ->line('Дата и время: ' . $this->event->start_at->format('d.m.Y H:i'))
            ->action('Посмотреть в Petopia', url('/dashboard'))
            ->line('Спасибо, что заботишься о своих питомцах!');
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('Напоминание: ' . $this->event->title)
            ->body('Задача для ' . $this->event->pet->name . ' в ' . $this->event->start_at->format('H:i'))
            ->icon('/images/Petopia.png')
            ->data(['url' => url('/dashboard')]);
    }
    
    public function toDatabase($notifiable)
    {        
        $exists = \App\Models\Notification::where('user_id', $notifiable->id)
            ->where('event_id', $this->event->id)
            ->exists();

        if (!$exists) {
            \App\Models\Notification::create([
                'user_id' => $notifiable->id,
                'pet_id'  => $this->event->pet_id,
                'event_id' => $this->event->id,
                'type'    => 'reminder',
                'title'   => 'Напоминание: ' . $this->event->title,
                'body'    => 'Задача для ' . $this->event->pet->name . ' в ' . $this->event->start_at->format('H:i'),
            ]);

            $this->event->update(['reminder_sent_at' => now()]);
        }

        return [];
    }

}