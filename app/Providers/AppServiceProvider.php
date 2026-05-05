<?php

namespace App\Providers;

use App\Models\Pet;
use App\Models\CalendarEvent;
use App\Policies\PetPolicy;
use App\Policies\CalendarEventPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Регистрация политики для модели Pet
        Gate::policy(Pet::class, PetPolicy::class);
        
        // Регистрация политики для модели CalendarEvent
        Gate::policy(CalendarEvent::class, CalendarEventPolicy::class);
    }
}