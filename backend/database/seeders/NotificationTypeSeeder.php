<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NotificationType;

class NotificationTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = ['Ticket Created', 'Ticket Assigned', 'Ticket Closed', 'Cancellation Requested', 'Cancellation Resolved', 'New User Registered'];

        foreach ($types as $name){
            NotificationType::firstOrCreate(['name' => $name]);
        }
    }
}