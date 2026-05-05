<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pet extends Model
{
    protected $fillable = [
        'owner_id', 'name', 'species', 'breed', 'birth_date', 'photo_url', 'weight', 'notes'
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function shares()
    {
        return $this->hasMany(PetShare::class);
    }

    public function events()
    {
        return $this->hasMany(CalendarEvent::class);
    }

    public function healthRecords()
    {
        return $this->hasMany(HealthRecord::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}