<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

//Public routes. no token requiered
//anyone can call these to create an account or get a token.
Route:: post('/register', [AuthController::class, 'register']);
Route:: post('/login', [AuthController::class, 'login']);

//Protected routes, require a  valid JWT
Route:: middleware('auth:api')->group(function(){
    Route:: get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// //Temporary route for testing role-based access control. Only users with roleId 1 (admin) can access this route.
// Route::middleware(['auth:api', 'role:1'])-> get('/admin-only', function(){
//     return response()->json(['message'=> 'Welcome, Admin!']);
// });
 