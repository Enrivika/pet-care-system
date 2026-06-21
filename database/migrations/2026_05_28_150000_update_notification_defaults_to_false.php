<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {        
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_email')->default(false)->change();
            $table->boolean('notify_push')->default(false)->change();
        });
        
        DB::table('users')->update([
            'notify_email' => false,
            'notify_push' => false,
            'updated_at'   => now(),
        ]);
    }

    public function down(): void
    {        
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_email')->default(true)->change();
            $table->boolean('notify_push')->default(true)->change();
        });
    }
};
