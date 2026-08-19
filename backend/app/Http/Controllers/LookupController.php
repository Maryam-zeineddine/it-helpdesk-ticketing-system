<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Priority;
use App\Models\Status;
use App\Models\User;

class LookupController extends Controller
{
    public function categories()
    {
        return response()->json(Category::all());
    }

    public function priorities()
    {
        return response()->json(Priority::all());
    }

    public function statuses()
    {
        return response()->json(Status::all());
    }

    public function agents()
    {
        $agents = User::whereHas('role', function ($query) {
            $query->whereIn('name', ['Agent', 'IT Support Agent']);
        })->get(['id', 'name', 'email']);

        return response()->json($agents);
    }

    public function roles()
    {
        return response()->json(\App\Models\Role::all());
    }
}