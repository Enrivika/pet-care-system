<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            // Делаем reminder_minutes nullable (можно не указывать напоминание)
            $table->integer('reminder_minutes')->nullable()->default(null)->change();
            
            // Добавляем поле для отслеживания отправки напоминания (для будущего)
            $table->timestamp('reminder_sent_at')->nullable()->after('reminder_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->integer('reminder_minutes')->nullable(false)->default(30)->change();
            $table->dropColumn('reminder_sent_at');
        });
    }
};