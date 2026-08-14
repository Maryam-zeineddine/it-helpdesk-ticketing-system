<?php

namespace App\Http\Controllers;

use App\Models\Status;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * List tickets.
     * Employees only see their own tickets; Agents only see tickets assigned to them;
     * Managers and Admins see all tickets.
     * Supports optional filtering by category_id, priority_id, status_id, and a text search.
     * By default, only tickets created in the last 2 months are returned — pass
     * show_all=1 to see everything, or from/to (YYYY-MM-DD) for an explicit range.
     */
    public function index(Request $request)
    {
        $user = Auth::guard('api')->user();
        $role = $user->role->name;

        $query = Ticket::with(['category', 'priority', 'status', 'employee', 'assignedAgent']);

        if ($role === 'Employee') {
            $query->where('employee_id', $user->id);
        }

        if(in_array($role, ['Agent', 'IT Support Agent'], true)){
            $query->where(function ($q) use ($user){
                $q->where('assigned_to', $user->id)
                  ->orWhereNull('assigned_to'); 
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('priority_id')) {
            $query->where('priority_id', $request->priority_id);
        }

        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        if ($request->boolean('active_only')){
            $excludedStatusIds = Status::whereIn('name', ['Closed', 'Resolved'])->pluck('id');
            $query->whereNotIn('status_id', $excludedStatusIds);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        //unless the caller explicitly asks for everything
        // (show_all=1) or supplies its own from/to dates, only return tickets
        // created within the last 2 months.
        if($request->filled('from') || $request->filled('to')){
            if($request->filled('from')){
                $query->whereDate('created_at', '>=', $request->from);
            }
            if($request->filled('to')){
                $query->whereDate('created_at', '<=', $request->to);
            }
        } elseif(! $request->boolean('show_all')){
            $query->where('created_at', '>=', now()->subMonths(2));
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Create a new ticket.
     * status_id and employee_id are set automatically, not accepted from the request.
     */
    public function store(Request $request)
    {
        $user = Auth::guard('api')->user();
        $role = $user->role->name;

        if(! in_array($role, ['Employee', 'Admin'], true)){
            return response() -> json(['error' => 'Only Employees and Admins can create tickets'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:150',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'priority_id' => 'required|exists:priorities,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $openStatus = Status::where('name', 'Open')->firstOrFail();

        $ticket = Ticket::create([
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'priority_id' => $request->priority_id,
            'status_id' => $openStatus->id,
            'employee_id' => Auth::guard('api')->id(),
        ]);

        //Notify the users when a ticket is created
        $recipientIds = \App\Services\NotificationService::userIdsWithRoles(
            ['Agent', 'IT Support Agent', 'Manager', 'Admin']
        );
        \App\Services\NotificationService::notify(
            $recipientIds,
            'New ticket created',
            "{$user->name} created a new ticket: \"{$ticket->title}\".",
            "/tickets/{$ticket->id}",
            'Ticket Created'
        );
        return response()->json($ticket->load(['category', 'priority', 'status', 'employee']), 201);
    }

    /**
     * Show a single ticket.
     * Employees can only view their own tickets.
     */
    public function show($id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::with(['category', 'priority', 'status', 'employee', 'assignedAgent'])->findOrFail($id);

        if ($user->role->name === 'Employee' && $ticket->employee_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return response()->json($ticket);
    }

    /**
     * Update a ticket. Permission matrix:
     * - Employee: only own ticket, only while Open; may edit title/description/category/priority.
     * - Agent: any ticket; may change status_id (freeform) and self-assign via assigned_to.
     * - Manager: forbidden (view/monitor only, per finalized Task 4 matrix).
     * - Admin: any ticket; may change anything.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::with('status')->findOrFail($id);
        $role = $user->role->name;

        //if the ticket's current status is "Closed" and the role is Agent, block the request entirely
        //this if happens before the switch ($role) block that builds $allowed, so it short-circuits everything downstream
        if ($ticket->status->name === 'Closed' && $role !=='Admin'){
            return response()->json([
                'error' => 'This ticket is closed and can no longer be modified.',
            ], 403);
        }

        //capture the "before" state, before anything gets updated
        $oldStatusId = $ticket->status_id;

        $allowed = [];

        switch ($role) {
            case 'Admin':
                $allowed = ['title', 'description', 'category_id', 'priority_id', 'status_id'];
                break;

            case 'Agent':
            case 'IT Support Agent':
                $allowed = ['status_id'];
                break;

            case 'Manager':
                $allowed = [];
                break;

            case 'Employee':
            default:
                if ($ticket->employee_id !== $user->id) {
                    return response()->json(['error' => 'Forbidden'], 403);
                }

                if ($ticket->status->name !== 'Open') {
                    return response()->json([
                        'error' => 'This ticket can no longer be edited because it is no longer Open.',
                    ], 403);
                }

                $allowed = ['title', 'description', 'category_id', 'priority_id'];
                break;
        }

        // Reject the whole request if it contains any field this role isn't allowed to touch
        $disallowed = array_diff(array_keys($request->all()), $allowed);
        if (! empty($disallowed)) {
            return response()->json([
                'error' => 'You are not allowed to update: '.implode(', ', $disallowed),
            ], 403);
        }

        $rules = [
            'title' => 'sometimes|string|max:150',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'priority_id' => 'sometimes|exists:priorities,id',
            'status_id' => 'sometimes|exists:statuses,id',
        ];

        // Only validate fields this role is allowed to touch
        $rules = array_intersect_key($rules, array_flip($allowed));

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $ticket->update($validator->validated());

        //if status_id was psrt of this update and  it actually changed, log it
        if(array_key_exists('status_id', $validator->validated()) && (int) $ticket->status_id !== (int) $oldStatusId){
            \App\Models\TicketStatusHistory::create([
                'ticket_id' => $ticket->id,
                'old_status_id' => $oldStatusId,
                'new_status_id' => $ticket->status_id,
                'changed_by' => $user->id,
            ]);

            $newStatus = \App\Models\Status::find($ticket->status_id);

            if($newStatus && $newStatus->name === 'Closed'){
                $recipientIds = \App\Services\NotificationService::userIdsWithRoles(['Manager', 'Admin']);
                $recipientIds[] = $ticket->employee_id;

                \App\Services\NotificationService::notify(
                    $recipientIds,
                    'Ticket closed',
                    "Ticket \"{$ticket->title}\" was closed by {$user->name}.",
                    "/tickets/{$ticket->id}",
                    'Ticket Closed'
                );
            }
        }

        return response()->json($ticket->load(['category', 'priority', 'status', 'employee', 'assignedAgent']));
    }

    /**
     * Delete a ticket.
     * Employees may only delete their own ticket, and only while it is still "Open".
     * Admin may delete any ticket. Agents and Managers may never delete.
     */
    public function destroy($id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::with('status')->findOrFail($id);
        $role = $user->role->name;

        if ($role === 'Admin') {
            $ticket->delete();

            return response()->json(['message' => 'Ticket deleted successfully']);
        }

        if ($role !== 'Employee') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ($ticket->employee_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ($ticket->status->name !== 'Open') {
            return response()->json([
                'error' => 'This ticket can no longer be deleted because it is no longer Open.',
            ], 403);
        }

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    /**
     * Assign a ticket to Agent.
     * - Employee: Forbidden
     * - Agent: may only assign the ticket to themselves (self assign/ "take" it).
     * - Manager: Forbidden (view/monitor only).
     * - Admin: may assign to any Agent.
     */
    public function assign(Request $request, $id)
    {
        $user = Auth::guard('api')->user();
        $role = $user->role->name;
        $ticket = Ticket::with('status')->findOrFail($id);

        //if the ticket's current status is "Closed", block the request of assigning entirely
        if ($ticket->status->name === 'Closed'){
            return response()->json(['error' => 'This ticket is closed and can no longer be assigned.'], 403);
        }

        if(! in_array($role, ['Agent', 'IT Support Agent', 'Admin'], true)){
            return response()->json(['error' => 'Forbidden'],403);
        }

        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $assignee = \App\Models\User::with('role')->findOrFail($request->assigned_to);

        //Agent may only assign the ticket to themselves
        if (in_array($role, ['Agent', 'IT Support Agent'], true) && (int) $assignee->id !== (int) $user->id){
            return response()->json(['error' => 'Agents may only assign a ticket to themselves'], 403);
        }

        //Whoever assigns it, the target must be an Agent
        if (! in_array($assignee->role->name, ['Agent', 'IT Support Agent'], true)){
            return response()->json(['error' => 'The assignee must be an Agent'], 422);
        }

        $ticket->update(['assigned_to' => $assignee->id]);

        \App\Models\ActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => (int) $assignee->id === (int) $user->id ? 'self_assigned' : 'assigned',
            'description' => (int) $assignee->id === (int) $user->id
                ? "{$user->name} took this ticket"
                : "{$user->name} assigned this ticket to {$assignee->name}.",
        ]);

        //Notify assignee
        if((int) $assignee->id !== (int) $user->id){
            \App\Services\NotificationService::notify(
                $assignee->id,
                'Ticket assigned to you',
                "\"{$ticket->title}\" has been assigned to you by {$user->name}.",
                "/tickets/{$ticket->id}",
                'Ticket Assigned'
            );
        }

        return response()->json($ticket->load(['category', 'priority', 'status', 'employee', 'assignedAgent']));
    }

/**
 * Combined activity feed for a ticket — merges activity_logs and ticket_status_history
 * into a single chronological timeline, ready for the frontend to render as-is. Instead of having to call two separate endpoints and merge it in the frontend, we do it here in the backend.
 */

public function activity($id)
{
    $user = Auth::guard('api')->user();
    $ticket = Ticket::findOrFail($id);
    $role = $user->role->name;

    if($user->role->name === 'Employee' && $ticket->employee_id !== $user->id){
        return response()->json(['error' => 'Forbidden'], 403);
    }

    if (in_array($role, ['Agent', 'IT Support Agent'], true) && $ticket->assigned_to !== $user->id){
        return response()->json(['error' => 'Forbidden'], 403);
    }

    //General activity: assignments, comments.. already in the shape we want
    $logs = $ticket->activityLogs()->with('user')->get()->map(function ($log){
        return [
            'action' => $log->action,
            'description' => $log->description,
            'user' => $log->user->name,
            'created_at' => $log->created_at,
        ];
    });

    //Status history: we need to convert old_status_id and new_status_id into names, and shape it like the activity logs
    $statusChanges = $ticket->statusHistory()->with(['oldStatus', 'newStatus', 'changedBy'])->get()->map(function ($history){
        $oldName = $history->oldStatus->name ?? 'none';
        $newName = $history->newStatus->name;

        return [
            'action' => 'status_changed',
            'description' => "{$history->changedBy->name} changed the status from {$oldName} to {$newName}.",
            'user' => $history->changedBy->name,
            'created_at' => $history->created_at,
        ];
    });

    //Merge both collections, sort by created_at ascending (oldest first), and return
    $timeline = $logs->concat($statusChanges)->sortBy('created_at')->values();

    return response()->json($timeline);
    }
}