<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    //create the notification_types lookup table
    public function up(): void{
        Schema:: create('notification_types', function(Blueprint $table){
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
    }

    public function down(): void{
        Schema::dropIfExists('notification_types');
    }
};