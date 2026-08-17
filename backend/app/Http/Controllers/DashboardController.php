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
        //Builds the report data array for the given request's range/dates.
    //Shared by the JSON endpoint and both export endpoints so the numbers
    //are guaranteed to match whatever's on screen.
    private function buildReportData(Request $request): array
    {
        $range = $request->query('range', 'month');

        if($range === 'year'){
            $start = now()->startOfYear();
            $end = now();
        } elseif ($range === 'custom'){
            $start = \Carbon\Carbon::parse($request->query('start_date'))->startOfDay();
            $end = \Carbon\Carbon::parse($request->query('end_date'))->endOfDay();
        } else {
            $range = 'month';
            $start = now()->startOfMonth();
            $end = now();
        }

        $query = Ticket::whereBetween('created_at', [$start, $end]);

        $statuses = Status::all();
        $countsByStatus = [];
        foreach($statuses as $status){
            $countsByStatus[$status->name] = (clone $query)->where('status_id', $status->id)->count();
        }

        $categories = \App\Models\Category::all();
        $countsByCategory = [];
        foreach($categories as $category){
            $countsByCategory[$category->name] = (clone $query)->where('category_id', $category->id)->count();
        }

        $priorities = \App\Models\Priority::all();
        $countsByPriority = [];
        foreach($priorities as $priority){
            $countsByPriority[$priority->name] = (clone $query)->where('priority_id', $priority->id)->count();
        }

        $finishedStatusIds = Status::whereIn('name', ['Resolved','Closed'])->pluck('id');

        $finishedTimes = \DB::table('ticket_status_history')
            ->join('tickets', 'tickets.id', '=', 'ticket_status_history.ticket_id')
            ->whereIn('ticket_status_history.new_status_id', $finishedStatusIds)
            ->whereBetween('tickets.created_at', [$start, $end])
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

        return [
            'range' => $range,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'total' => $query->count(),
            'by_status' => $countsByStatus,
            'by_category' => $countsByCategory,
            'by_priority' => $countsByPriority,
            'average_resolution_hours' => $averageResolutionHours,
        ];
    }

    //Checks Admin role and, for a custom range, that both dates were provided.
    //Returns an error response to short-circuit with, or null if everything's fine.
    private function reportGuardFailure(Request $request)
    {
        $user = Auth::guard('api')->user();

        if(! $user->role || $user->role->name !== 'Admin'){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if($request->query('range', 'month') === 'custom'
            && (! $request->query('start_date') || ! $request->query('end_date'))){
            return response()->json(['error' => 'start_date and end_date are required for a custom range'], 422);
        }

        return null;
    }

    public function report(Request $request)
    {
        if($failure = $this->reportGuardFailure($request)) return $failure;

        return response()->json($this->buildReportData($request));
    }

    public function exportPdf(Request $request)
    {
        if($failure = $this->reportGuardFailure($request)) return $failure;

        $reportData = $this->buildReportData($request);
        $pdf = \PDF::loadView('reports.pdf', ['report' => $reportData]);

        return $pdf->download('it-helpdesk-report-'.$reportData['range'].'.pdf');
    }

    public function exportExcel(Request $request)
    {
        if($failure = $this->reportGuardFailure($request)) return $failure;

        $reportData = $this->buildReportData($request);

        $filename = 'it-helpdesk-report-'.$reportData['range'].'.csv';

        $callback = function() use ($reportData) {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['IT Help Desk Report']);
            fputcsv($file, ['Range', $reportData['range']]);
            fputcsv($file, ['Start Date', $reportData['start_date']]);
            fputcsv($file, ['End Date', $reportData['end_date']]);
            fputcsv($file, ['Total Tickets', $reportData['total']]);
            fputcsv($file, ['Average Resolution (hours)', $reportData['average_resolution_hours'] ?? 'N/A']);
            fputcsv($file, []);

            fputcsv($file, ['Tickets by Status']);
            foreach($reportData['by_status'] as $label => $count){
                fputcsv($file, [$label, $count]);
            }
            fputcsv($file, []);

            fputcsv($file, ['Tickets by Category']);
            foreach($reportData['by_category'] as $label => $count){
                fputcsv($file, [$label, $count]);
            }
            fputcsv($file, []);

            fputcsv($file, ['Tickets by Priority']);
            foreach($reportData['by_priority'] as $label => $count){
                fputcsv($file, [$label, $count]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }
}