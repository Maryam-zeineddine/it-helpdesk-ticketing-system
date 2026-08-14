<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'notification_type_id', 'subject', 'description', 'link', 'is_read'];

    //The one who receives the notification
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    //The category of the notification
    public function type()
    {
        return $this->belongsTo(NotificationType::class, 'notification_type_id');
    }


}