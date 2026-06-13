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

    if ($user) {
        $user->notify(new PetReminderNotification($event));

        $exists = CustomNotification::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->exists();

        if (!$exists) {
            $category = $event->event_type;
            $petName  = $event->pet->name;
            $when     = $event->start_at->format('d.m.Y') . ' в ' . $event->start_at->format('H:i');

            // Цвета категорий
            $categoryColors = [
                'Кормление'  => '#DA985D',
                'Поение'     => '#4CA9B3',
                'Прогулка'   => '#6D8967',
                'Игры'       => '#984343',
                'Лекарство'  => '#C4585A',
                'Гигиена'    => '#11759D',
                'Ветеринар'  => '#5E8086',
                'Укол'       => '#625AAE',
                'Обучение'   => '#906889',
                'Груминг'    => '#847452',
                'Уборка'     => '#8F5E5E',
                'Другое'     => '#6F6F6F',
            ];

            $color = $categoryColors[$category] ?? '#6F6F6F';

            // Title: категория цветная и жирная
            $title = 'Напоминание: <strong style="color:' . $color . '">' . $category . '</strong> для <strong>' . $petName . '</strong>';

            $bodyLines = [
                'Дата и время: <strong>' . $when . '</strong>',
            ];

            $eventTitle = trim((string) ($event->title ?? ''));
            if ($eventTitle !== '') {
                // Название задачи — чуть меньше и с прозрачностью
                $bodyLines[] = '<span style="font-size:13px; opacity:0.85;">Название: ' . $eventTitle . '</span>';
            }

            CustomNotification::create([
                'user_id'  => $user->id,
                'pet_id'   => $event->pet_id,
                'event_id' => $event->id,
                'type'     => 'reminder',
                'title'    => $title,
                'body'     => implode("\n", $bodyLines),
            ]);
        }

        $event->update(['reminder_sent_at' => now()]);
        $sent++;
    }
}
}