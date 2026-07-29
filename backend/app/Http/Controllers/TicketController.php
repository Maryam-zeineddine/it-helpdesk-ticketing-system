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
     * Employees only see their own tickets; other roles see all tickets.
     * Supports optional filtering by category_id, priority_id, status_id, and a text search.
     */
    public function index(Request $request)
    {
        $user = Auth::guard('api')->user();

        $query = Ticket::with(['category', 'priority', 'status', 'employee', 'assignedAgent']);

        if ($user->role->name === 'Employee') {
            $query->where('employee_id', $user->id);
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

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Create a new ticket.
     * status_id and employee_id are set automatically, not accepted from the request.
     */
    public function store(Request $request)
    {
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
     * - Manager: any ticket; may only reassign via assigned_to (to any agent).
     * - Admin: any ticket; may change anything.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::guard('api')->user();
        $ticket = Ticket::with('status')->findOrFail($id);
        $role = $user->role->name;

        $allowed = [];

        switch ($role) {
            case 'Admin':
                $allowed = ['title', 'description', 'category_id', 'priority_id', 'status_id', 'assigned_to'];
                break;

            case 'Agent':
            case 'IT Support Agent':
                $allowed = ['status_id', 'assigned_to'];
                break;

            case 'Manager':
                $allowed = ['assigned_to'];
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

        // An Agent may only assign the ticket to themself ("receiving" it) —
        // checked before validation so it isn't masked by an "invalid user id" error
        if (in_array($role, ['Agent', 'IT Support Agent'], true) && $request->filled('assigned_to')
            && (int) $request->assigned_to !== (int) $user->id) {
            return response()->json(['error' => 'Agents may only assign a ticket to themselves'], 403);
        }

        $rules = [
            'title' => 'sometimes|string|max:150',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'priority_id' => 'sometimes|exists:priorities,id',
            'status_id' => 'sometimes|exists:statuses,id',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ];

        // Only validate fields this role is allowed to touch
        $rules = array_intersect_key($rules, array_flip($allowed));

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $ticket->update($validator->validated());

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
}