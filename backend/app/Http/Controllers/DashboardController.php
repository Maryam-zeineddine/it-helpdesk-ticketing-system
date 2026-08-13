<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Status;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Return a role-scoped summary for the landing dashboard:
     * ticket counts by status, plus a total, for whichever tickets
     * this user is allowed to see.
     * Employees -> only their own tickets. Agents -> only tickets assigned to them & unassigned to them.
     * Managers/Admins -> all tickets.
     */

    public function summary()
    {
        $user = Auth::guard('api')->user();
        $role = $user->role->name;

        $query = Ticket::query();

        if($role === 'Employee'){
            $query->where('employee_id', $user->id);
        }

        if(in_array($role, ['Agent', 'IT Support Agent'], true)){
            $query->where(function ($q) use ($user){
                $q->where('assigned_to', $user->id)
                  ->orWhereNull('assigned_to');
            });
        }

        //Only count what's happened recently by default, the summary reflects "what's going on"
        $query->where('created_at', '>=', now()->subMonths(2));

        $statuses = Status::all();
        $countsByStatus = [];

        foreach ($statuses as $status){
            $countsByStatus[$status->name] = (clone $query)
                ->where('status_id', $status->id)
                ->count();
        }

        return response()->json([
            'role' => $role,
            'total' => $query->count(),
            'by_status' =>  $countsByStatus,
        ]);

        //Agents also see the unassigned tickets
        if(in_array($role, ['Agent', 'IT Support Agent', 'Admin'], true)){
            $response['unassigned_tickets'] = Ticket::with('category')
                ->whereNull('assigned_to')
                ->where('created_at', '>=', now()->subMonths(2))
                ->latest()
                ->get(['id', 'title', 'category_id', 'created_at']);
        }

        return response() -> json($response);
    }
}