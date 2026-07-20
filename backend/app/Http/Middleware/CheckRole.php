<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if(! $user || ! in_array($user->role_id, $roles)){
            return response()->json (['error'=>'Forbidden - insufficient role'], 403);
        }
        return $next($request);
    }
}
