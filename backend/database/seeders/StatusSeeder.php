<?php

namespace Database\Seeders;

use App\Models\Status;
use Illuminate\Database\Seeder;

class StatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            'Open',
            'In Progress',
            'Pending',
            'Resolved',
            'Closed',
            'Cancellation Requested',
            'Cancelled',
        ];

        foreach ($statuses as $name) {
            Status::firstOrCreate(['name' => $name]);
        }
    }
}