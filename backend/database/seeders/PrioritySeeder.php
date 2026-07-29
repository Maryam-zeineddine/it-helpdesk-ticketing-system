<?php

namespace Database\Seeders;

use App\Models\Priority;
use Illuminate\Database\Seeder;

class PrioritySeeder extends Seeder
{
    public function run(): void
    {
        $priorities = [
            'Low',
            'Medium',
            'High',
            'Critical',
        ];

        foreach ($priorities as $name) {
            Priority::firstOrCreate(['name' => $name]);
        }
    }
}