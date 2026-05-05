<?php

namespace App\Policies;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PetPolicy
{
    /**
     * Определяет, может ли пользователь просматривать питомца.
     */
    public function view(User $user, Pet $pet): bool
    {
        // Владелец или тот, кому дали доступ
        return $user->id === $pet->owner_id || 
               $pet->shares()->where('user_id', $user->id)->exists();
    }

    /**
     * Определяет, может ли пользователь создавать питомцев.
     */
    public function create(User $user): bool
    {
        return true; // Любой авторизованный пользователь может создавать
    }

    /**
     * Определяет, может ли пользователь редактировать питомца.
     */
    public function update(User $user, Pet $pet): bool
    {
        // Только владелец или редактор
        return $user->id === $pet->owner_id || 
               $pet->shares()->where('user_id', $user->id)
                             ->where('role', 'editor')
                             ->exists();
    }

    /**
     * Определяет, может ли пользователь удалять питомца.
     */
    public function delete(User $user, Pet $pet): bool
    {
        return $user->id === $pet->owner_id; // Только владелец
    }
}