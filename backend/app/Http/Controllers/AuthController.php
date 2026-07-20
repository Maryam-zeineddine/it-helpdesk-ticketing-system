<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(),[
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'nullable|exists:roles,id', 
        ]);

        if($validator -> fails())
            {
                return response() -> json($validator->errors(),422);
            }
        
        $user = User::create([
            'name' => $request -> name,
            'email' => $request -> email,
            'password' => $request -> password, //auto-hashed via the 'hashed' cast in the User model
            'role_id' => $request->role_id,
        ]);

        $token = JWTAuth::fromUser($user);

        return response() -> json([
            'user' => $user,
            'token' => $token,
        ], 201);

    }

    /**
     * Login in an existing user and return a JWT token
     */

    public function login(Request $request)
    {
        $credentials = $request ->only('email', 'password');

        if(! $token = Auth:: guard('api') -> attempt($credentials))
            {
                return response() -> json(['error' => 'Invalid credentials'], 401);
            }

        return response() -> json([
            'token' => $token,
        ]);
    }

    /**
     * Get the currently authenticated user
     */

    public function me()
    {
        return response()->json(Auth::guard('api')->user());

    }

    /**
     * Log out the current user (invalidate the token)
     */

    public function logout()
    {
        Auth::guard('api') -> logout();

        return response() -> json (['message' => 'Successfully logged  out']);
    }
    
}
