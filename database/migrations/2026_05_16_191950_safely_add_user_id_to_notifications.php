<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Добавляем колонку, если её ещё нет
        if (!Schema::hasColumn('notifications', 'user_id')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            });
        }

        // 2. Заполняем существующие записи (берём первого пользователя)
        $firstUserId = DB::table('users')->value('id');
        if ($firstUserId) {
            DB::table('notifications')
                ->whereNull('user_id')
                ->update(['user_id' => $firstUserId]);
        }

        // 3. Делаем колонку обязательной (если ещё не)
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });

        // 4. Добавляем внешний ключ (если ещё не добавлен)
        $foreignKeyExists = collect(DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'notifications' 
            AND CONSTRAINT_NAME = 'notifications_user_id_foreign'
        "))->isNotEmpty();

        if (!$foreignKeyExists) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreign('user_id')
                      ->references('id')
                      ->on('users')
                      ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};