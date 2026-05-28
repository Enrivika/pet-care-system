<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Меняем дефолтные значения на false (для новых пользователей)
        DB::statement('ALTER TABLE `users` MODIFY `notify_email` BOOLEAN NOT NULL DEFAULT FALSE');
        DB::statement('ALTER TABLE `users` MODIFY `notify_push` BOOLEAN NOT NULL DEFAULT FALSE');

        // Принудительно отключаем уведомления у всех существующих пользователей
        DB::table('users')->update([
            'notify_email' => false,
            'notify_push' => false,
            'updated_at'   => now(),
        ]);
    }

    public function down(): void
    {
        // Возврат к старым дефолтам (если понадобится откатить миграцию)
        DB::statement('ALTER TABLE `users` MODIFY `notify_email` BOOLEAN NOT NULL DEFAULT TRUE');
        DB::statement('ALTER TABLE `users` MODIFY `notify_push` BOOLEAN NOT NULL DEFAULT TRUE');
    }
};
