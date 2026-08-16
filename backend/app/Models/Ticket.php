<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'reference_no',
    'title',
    'description',
    'category_id',
    'priority_id',
    'status_id',
    'employee_id',
    'assigned_to',
])]
class Ticket extends Model
{
    /**
     * Auto-generate the reference_no right before a ticket is created,
     * in the format TCK-{year}-{4-digit sequence}, e.g. TCK-2026-0001.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function(Ticket $ticket){
            if(empty($ticket->reference_no)){
                $year = now()->year;
                $prefix = "TCK-{$year}-";
                $lastTicket = static::where('reference_no', 'like', $prefix.'%')
                    ->orderByDesc('id')
                    ->first();

                $nextNumber = $lastTicket
                    ?((int) substr($lastTicket->reference_no, -4)) +1 : 1;

                $ticket->reference_no = $prefix.str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }

        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function priority()
    {
        return $this->belongsTo(Priority::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    // The employee who created/submitted the ticket
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    // The support agent the ticket is assigned to
    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
//Comments, activity logs and status history are hasMany, not belongsTo — a ticket can have many comments, many activity log entries, and many status history rows, 
// whereas a comment/log/history row belongs to just one ticket.

    // A ticket can have many comments/replies left by users
    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }

    //A ticket can have many activity log entries (its audit trail)
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    //A ticket can have many status history records (its status timeline)
    public function statusHistory()
    {
        return $this->hasMany(TicketStatusHistory::class);
    }

    public function attachments()
    {
        return  $this->hasMany(Attachment::class);
    }

}