<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('name')->nullable();
            $table->string('password')->nullable(); // Hashed password (только для регистрации)
            $table->string('code'); // Hashed 6-digit code
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('type', ['registration', 'email_change'])->index();
            $table->timestamp('expires_at');
            $table->timestamps();

            // Один активный код верификации на email + тип
            $table->unique(['email', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verifications');
    }
};