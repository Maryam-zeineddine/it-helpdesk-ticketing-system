<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    public $timsestamps = false;

    public function users(){
        return $this->hasMany(User::class);
    }
}