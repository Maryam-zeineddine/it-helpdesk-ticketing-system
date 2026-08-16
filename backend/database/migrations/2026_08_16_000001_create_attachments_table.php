<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    //creation of attachment table
    public function up(): void{
        Schema::create('attachments', function(Blueprint $table){
            $table->id();
            $table->foreignId('ticket_id')->nullable()->constrained()->cascadedOnDelete();
            $table->foreignId('comment_id')->nullable()->constrained('ticket_comments')->cascadedOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadedOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedInteger('file_size');
            $table->timestamps();
        });
    }

    public function down(): void{
        Schema::dropIfExists('attachments');
    }
};