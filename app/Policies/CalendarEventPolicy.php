<?php

namespace App\Policies;

use App\Models\CalendarEvent;
use App\Models\User;

class CalendarEventPolicy
{
    /**
     * Просмотр события — только владелец питомца
     */
    public function view(User $user, CalendarEvent $event): bool
    {
        return $user->id === $event->pet->owner_id;
    }

    /**
     * Создание/редактирование/удаление — только владелец питомца
     */
    public function update(User $user, CalendarEvent $event): bool
    {
        return $user->id === $event->pet->owner_id;
    }

    /**
     * Удаление — только владелец
     */
    public function delete(User $user, CalendarEvent $event): bool
    {
        return $user->id === $event->pet->owner_id;
    }
}