<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    protected $fillable =[
        'ticket_id', 'comment_id', 'uploaded_by', 'file_name', 'file_path', 'mime_type', 'file_size',
    ];


    //the ticket this attachment belongs to and null if it is for a comment
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    //the comment this attachment belongs to and null if for a ticket
    public function comment()
    {
        return $this->belongsTo(TicketComment::class, 'comment_id');
    }

    //the user who upload the attachment
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
    
}