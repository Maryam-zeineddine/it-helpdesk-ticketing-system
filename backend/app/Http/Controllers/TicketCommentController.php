<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\ActivityLog;

class TicketCommentController extends Controller
{
    //index($id) — list comments for a ticket
    //Employees may only view comments on their own ticket, and never see internal notes.

    public function index($id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::findOrFail($id);
        $role = $user->role->name;

        if ($role === 'Employee' && $ticket->employee_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = TicketComment::with(['user', 'attachment'])->where('ticket_id', $ticket->id);
        
        if ($role === 'Employee') {
            $query->where('is_internal', false);
        }

        return response()->json($query->latest()->get());
    }

    //store(Request $request, $id) — add a comment
    //Employees may only comment on their own ticket. Only Agents may mark a comment internal.

    public function store(Request $request, $id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::findOrFail($id);
        $role = $user->role->name;

        if ($role === 'Employee' && $ticket->employee_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        //attach an image
        //'bail' stops at the first failing rule).
        $validator = Validator::make($request->all(), [
           'body' => 'required|string',
           'image' => 'bail|nullable|file|min:1024|max:10240|mimes:jpg,jpeg,png,gif',
        ], [
            'image.min' => 'Image is too small. Minimum size is 1MB.',
            'image.max' => 'Image is too large. Maximum size is 10MB.',
            'image.mimes' => 'Only jpg, jpeg, png, or gif images are allowed on comments.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Only Agents can set is_internal to true
        $isInternal = in_array($role, ['Agent', 'IT Support Agent'], true) && $request->boolean('is_internal');

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $request->body,
            'is_internal' => $isInternal,
        ]);

        // If an image was included, store it 
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('attachments', 'public');

            \App\Models\Attachment::create([
                'comment_id' => $comment->id,
                'uploaded_by' => $user->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'commented',
            'ticket_id' => $ticket->id,
            'description' => "{$user->name} added a comment.",
        ]);

        return response()->json($comment->load(['user', 'attachment']), 201);
    }
}

