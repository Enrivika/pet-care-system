<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalendarEvent extends Model
{
    protected $fillable = [
        'pet_id', 'created_by', 'title', 'event_type', 'start_at', 'end_at',
        'is_recurring', 'recurrence_rule', 'reminder_minutes', 'is_completed',
        'completed_at', 'notes', 'is_medical', 'is_all_day', 'reminder_sent_at'
    ];

    protected $casts = [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'reminder_minutes' => 'integer',
            'reminder_sent_at' => 'datetime',
            'is_recurring' => 'boolean',
            'is_completed' => 'boolean',
            'is_medical' => 'boolean',
            'is_all_day' => 'boolean',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope для будущих уведомлений (задачи, у которых пришло время напомнить)
    public function scopeNeedsReminder($query)
    {
        return $query->whereNotNull('reminder_minutes')
            ->whereNull('reminder_sent_at')
            ->where('start_at', '>', now());
    }
}