<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AttachmentController;

//Public routes. no token requiered
//anyone can call these to create an account or get a token.
Route:: post('/register', [AuthController::class, 'register']);
Route:: post('/login', [AuthController::class, 'login']);

//Protected routes, require a  valid JWT
Route:: middleware('auth:api')->group(function(){
    Route:: get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::put('/tickets/{id}', [TicketController::class, 'update']);
    Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);
    Route::get('/categories', [LookupController::class, 'categories']);
    Route::get('/priorities', [LookupController::class, 'priorities']);
    Route::get('/statuses', [LookupController::class, 'statuses']);
    Route::get('/agents', [LookupController::class, 'agents']);
    Route::post('/tickets/{id}/assign', [TicketController::class,'assign']);
    Route::get('/tickets/{id}/comments', [TicketCommentController::class, 'index']);
    Route::post('/tickets/{id}/comments', [TicketCommentController::class, 'store']);
    Route::get('/tickets/{id}/activity', [TicketController::class, 'activity']);
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/tickets/{id}/attachments', [AttachmentController::class, 'storeForTicket']);
});



 