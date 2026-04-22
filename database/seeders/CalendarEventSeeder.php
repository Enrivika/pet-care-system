<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Seeder;

class CalendarEventSeeder extends Seeder
{
    public function run(): void
    {
        $murka = Pet::where('name', 'Мурка')->first();
        $vika = User::where('email', 'vika@example.com')->first();

        CalendarEvent::create([
            'pet_id' => $murka->id,
            'created_by' => $vika->id,
            'title' => 'Кормление сухим кормом',
            'event_type' => 'feeding',
            'start_at' => now()->addHours(2),
            'is_recurring' => true,
            'recurrence_rule' => 'daily',
            'reminder_minutes' => 30,
        ]);

        CalendarEvent::create([
            'pet_id' => $murka->id,
            'created_by' => $vika->id,
            'title' => 'Вакцинация от бешенства',
            'event_type' => 'vet',
            'start_at' => now()->addDays(5),
            'reminder_minutes' => 1440, // 1 день
        ]);
    }
}