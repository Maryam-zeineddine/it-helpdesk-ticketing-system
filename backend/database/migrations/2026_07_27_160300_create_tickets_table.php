<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no', 45)->unique();
            $table->string('title', 150);
            $table->text('description');
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('priority_id')->constrained('priorities');
            $table->foreignId('status_id')->constrained('statuses');
            $table->foreignId('employee_id')->nullable()->constrained('users');
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};