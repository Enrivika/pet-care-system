<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $fillable = [
        'pet_id', 'created_by', 'title', 'event_type', 'start_at', 'end_at',
        'is_recurring', 'recurrence_rule', 'reminder_minutes', 'is_completed',
        'completed_at', 'notes', 'is_medical'
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_recurring' => 'boolean',
        'is_completed' => 'boolean',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}