<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PetShare extends Model
{
    protected $fillable = ['pet_id', 'user_id', 'role', 'invited_at', 'accepted_at'];

    protected $casts = [
        'invited_at' => 'datetime',
        'accepted_at' => 'datetime',
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