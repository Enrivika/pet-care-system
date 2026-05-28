<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class EmailVerification extends Model
{
    protected $fillable = [
        'email',
        'code',
        'user_id',
        'type',
        'expires_at',
        'name',
        'password',
    ];

    protected $hidden = [
        'code',
        'password',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
