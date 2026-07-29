<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name'])]
class Priority extends Model
{
    public $timestamps = false;

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }
}