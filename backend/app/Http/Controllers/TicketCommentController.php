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

        $query = TicketComment::with('user')->where('ticket_id', $ticket->id);
        
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

        $validator = Validator::make($request->all(), [
           'body' => 'required|string',
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

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'commented',
            'ticket_id' => $ticket->id,
            'description' => "{$user->name} added a comment.",
        ]);

        return response()->json($comment->load('user'), 201);
    }



}

