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
    $link = url('/dashboard');

    $mail = (new MailMessage)
        ->subject('Petopia')
        ->greeting('Привет, ' . $notifiable->name . '!')
        ->line('Напоминаем о задаче для питомца **' . $this->event->pet->name . '**!')
        ->line('Категория: **' . $this->event->event_type . '**');

    // Название: показываем только если оно есть
    $title = trim((string) ($this->event->title ?? ''));
    if ($title !== '') {
        $mail->line('Название: **' . $title . '**');
    }

    $mail
        ->line('Дата и время: **' . $this->event->start_at->format('d.m.Y') . ' в ' . $this->event->start_at->format('H:i') . '**')
        ->action('Посмотреть в Petopia', $link)
        ->line('Спасибо, что ухаживаешь за своими питомцами!');

    return $mail;
}

public function toWebPush($notifiable, $notification)
{
    $category = (string) $this->event->event_type;
    $petName  = (string) $this->event->pet->name;

    $when = $this->event->start_at->format('d.m.Y') . ' в ' . $this->event->start_at->format('H:i');

    $title = 'Напоминание: ' . $category . ' для ' . $petName;

    $lines = [
        'Дата и время: ' . $when,
    ];

    $eventTitle = trim((string) ($this->event->title ?? ''));
    if ($eventTitle !== '') {
        $lines[] = 'Название: ' . $eventTitle;
    }

    return (new WebPushMessage)
        ->title($title)
        ->body(implode("\n", $lines))
        ->icon('/images/Petopia.png')
        ->data(['url' => '/dashboard']);
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
                'body'    => $this->event->event_type . ' • Задача для ' . $this->event->pet->name . ' — ' . $this->event->start_at->format('d.m.Y H:i'),
            ]);

            $this->event->update(['reminder_sent_at' => now()]);
        }

        return [];
    }

}