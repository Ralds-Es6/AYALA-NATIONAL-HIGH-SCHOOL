<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->unsignedInteger('max_capacity')->default(45)->after('room');
            $table->string('shift')->default('Whole Day Shift')->after('max_capacity'); // 'Whole Day Shift', 'Morning Shift', 'Afternoon Shift', 'Custom Shift'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn(['max_capacity', 'shift']);
        });
    }
};
