<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    //list the user's notification
    public function index()
    {
        $user = Auth::guard('api') -> user();

        $notifications = Notification::with('type')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response() -> json($notifications);
    }

    //Return the unread count on the bell icon
    public function unreadCount()
    {
        $user = Auth::guard('api') -> user();

        $count = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response() -> json(['unread_count' => $count]);
    }

    //mark a notification as read 
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::guard('api') -> user();
        $notification = Notification::where('user_id', $user -> id) -> findOrFail($id);

        $isRead = $request->has('is_read') ? $request->boolean('is_read') : true;

        $notification->update(['is_read' => $isRead]);

        return response() -> json($notification);
    }
}