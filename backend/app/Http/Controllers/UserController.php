<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    //list all users so that roles can be assigned/changed(for admins)
    public function index()
    {
        $user = Auth::guard('api')->user();
        if(! $user->role || $user->role->name !== 'Admin'){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $users = User::with('role')
            ->orderByRaw('role_id IS NOT NULL')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    //admins can assign or change a user's role
    public function assignRole(Request $request, $id)
    {
        $admin = Auth::guard('api')->user();
        if(! $admin->role || $admin->role->name !== 'Admin'){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $targetUser = User::findOrFail($id);
        $targetUser->role_id = $request->role_id;
        $targetUser->save();

        return response()->json($targetUser->load('role'));
    }

    //admins can delete a user if there is no tickets
    public function destroy($id)
    {
        $admin = Auth::guard('api')->user();
        if(! $admin->role || $admin->role->name !== 'Admin'){
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if((int) $id === (int) $admin->id){
            return response()->json(['error' => 'You cannot delete your own account'], 422);
        }

        $targetUser = User::findOrFail($id);

        $hasTickets = \App\Models\Ticket::where('employee_id', $targetUser->id)
            ->orWhere('assigned_to', $targetUser->id)
            ->exists();

        if($hasTickets){
            return response()->json([
                'error'=>'This user has tickets attached (submitted or assigned) and cannot be deleted. Reassign or resolve those tickets first',
            ],422);
        }

        $targetUser->delete();

        return response()->json(['message'=>'User deleted']);
    }
}