<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    //create notifications table, each row is one notification for a user, and it is linked to the notification type
    //by the lookup table natification_table_types
    public function up(): void{
        Schema::create('notifications', function(Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('notification_type_id')->constrained('notification_types');
            $table->string('subject');
            $table->text('description');
            $table->string('link')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
    
};