<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Status;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

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
        if(! $user->role){
            return response()->json(['error' => 'Your account has no role assigned. Contact an administrator.'], 403);
        }
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

        $response = [
            'role' => $role,
            'total' => $query->count(),
            'by_status' =>  $countsByStatus,
        ];

        //Agents and Admins also see the unassigned tickets, including who reported each one
        if(in_array($role, ['Agent', 'IT Support Agent', 'Admin'], true)){
            $response['unassigned_tickets'] = Ticket::with(['category', 'employee'])
                ->whereNull('assigned_to')
                ->where('created_at', '>=', now()->subMonths(2))
                ->latest()
                ->get(['id', 'title', 'category_id', 'employee_id', 'created_at']);
        }

        return response()->json($response);
    }

    //reports for admins
    public function report (Request $request)
    {
        $user = Auth::guard('api') -> user();

        if(! $user->role || $user->role->name !== 'Admin'){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $range = $request->query('range', 'month');
        $start = $range === 'year' ? now()->startOfYear() : now()->startOfMonth();

        $query = Ticket::where('created_at', '>=', $start);


        $statuses = Status::all();
        $countsByStatus = [];
        foreach($statuses as $status){
            $countsByStatus[$status->name] = (clone $query)->where('status_id', $status->id)->count();
        }

        //foreach ticket find the earliest time it hit either resolved or closed, then measure how long
        // that took from creation. Averaged across all finished tickets in range.
        $finishedStatusIds = Status::whereIn('name', ['Resolved','Closed'])->pluck('id');

        $finishedTimes = \DB::table('ticket_status_history')
            ->join('tickets', 'tickets.id', '=', 'ticket_status_history.ticket_id')
            ->whereIn('ticket_status_history.new_status_id', $finishedStatusIds)
            ->where('tickets.created_at', '>=', $start)
            ->select(
                'ticket_status_history.ticket_id',
                \DB::raw('MIN(ticket_status_history.created_at) as finished_at'),
                'tickets.created_at as ticket_created_at'
            )
            ->groupBy('ticket_status_history.ticket_id', 'tickets.created_at')
            ->get();

        $averageResolutionHours = null;
        if($finishedTimes->count() > 0){
            $totalHours = $finishedTimes->sum(function ($row){
                return \Carbon\Carbon::parse($row->ticket_created_at)
                ->diffInHours(\Carbon\Carbon::parse($row->finished_at));
            });
            $averageResolutionHours = round($totalHours / $finishedTimes->count());
        }

        return response()->json([
            'range' => $range,
            'total' => $query ->count(),
            'by_status' => $countsByStatus,
            'average_resolution_hours' => $averageResolutionHours,
        ]);
    }
}