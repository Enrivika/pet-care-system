<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'user_id',
        'push_enabled',
        'email_enabled',
        'export_format',
        'language',
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'email_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}