<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'ticket_id',
    'old_status_id',
    'new_status_id',
    'changed_by',
])]

class TicketStatusHistory extends Model
{
    public $timestamps = false;

    public function ticket(){
        return $this->belongsTo(Ticket::class);
    }

    public function oldStatus(){
        return $this->belongsTo(Status::class, 'old_status_id');
    }

    public function newStatus(){
        return $this->belongsTo(Status::class, 'new_status_id');
    }

    public function changedBy(){
        return $this->belongsTo(User::class, 'changed_by');
    }

    protected $table = 'ticket_status_history';
}
