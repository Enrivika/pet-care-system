<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'pet_id',
        'event_id',
        'type',
        'title',
        'body',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function event()
    {
        return $this->belongsTo(CalendarEvent::class, 'event_id');
    }
}