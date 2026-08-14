<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\NotificationType;
use App\Models\User;

class NotificationService
{
    // Create a notification for users
    public static function notify($userIds, string $subject, string $description, ?string $link, string $typeName): void
    {
        $type = NotificationType::where('name', $typeName)->firstOrFail();
        $userIds = is_array($userIds) ? $userIds : [$userIds];

        foreach ($userIds as $userId) {
            Notification::create([
                'user_id' => $userId,
                'notification_type_id' => $type->id,
                'subject' => $subject,
                'description' => $description,
                'link' => $link,
                'is_read' => false,
            ]);
        }
    }

    // Get the ids of all users who have any of the given role names
    public static function userIdsWithRoles(array $roleNames): array
    {
        return User::whereHas('role', function ($q) use ($roleNames) {
            $q->whereIn('name', $roleNames);
        })->pluck('id')->toArray();
    }
}