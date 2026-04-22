<?php

namespace Database\Seeders;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Seeder;

class PetSeeder extends Seeder
{
    public function run(): void
    {
        $vika = User::where('email', 'vika@example.com')->first();
        $alex = User::where('email', 'alex@example.com')->first();

        Pet::create([
            'owner_id' => $vika->id,
            'name' => 'Мурка',
            'species' => 'cat',
            'breed' => 'Британская короткошёрстная',
            'birth_date' => '2022-03-15',
            'photo_url' => 'https://picsum.photos/id/1015/600/400',
            'weight' => 4.2,
            'notes' => 'Очень ласковая, боится громких звуков',
        ]);

        Pet::create([
            'owner_id' => $vika->id,
            'name' => 'Барсик',
            'species' => 'cat',
            'breed' => 'Шотландская вислоухая',
            'birth_date' => '2021-11-20',
            'photo_url' => 'https://picsum.photos/id/1027/600/400',
            'weight' => 5.8,
            'notes' => 'Любит играть с лазерной указкой',
        ]);

        Pet::create([
            'owner_id' => $alex->id,
            'name' => 'Рекс',
            'species' => 'dog',
            'breed' => 'Золотистый ретривер',
            'birth_date' => '2020-07-10',
            'photo_url' => 'https://picsum.photos/id/106/600/400',
            'weight' => 32.5,
            'notes' => 'Очень активный, требует долгого выгула',
        ]);
    }
}