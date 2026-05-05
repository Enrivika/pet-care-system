<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    protected $fillable = [
        'pet_id',
        'user_id',
        'record_type',
        'title',
        'description',
        'record_date',
        'next_due_date',
        'attachment_path',
    ];

    protected $casts = [
        'record_date' => 'date',
        'next_due_date' => 'date',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}