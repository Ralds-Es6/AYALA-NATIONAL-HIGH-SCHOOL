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
        // 1. Create section_breaks table
        Schema::create('section_breaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->cascadeOnDelete();
            $table->string('name'); // e.g. "Lunch Break", "Morning Break"
            $table->string('break_type')->default('custom'); // lunch, morning, afternoon, custom
            $table->string('day_of_week'); // Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();

            $table->index(['school_class_id', 'day_of_week']);
            $table->index(['day_of_week', 'start_time', 'end_time']);
        });

        // 2. Add session_type and notes to schedules table
        Schema::table('schedules', function (Blueprint $table) {
            $table->string('session_type')->default('lecture')->after('room'); // lecture, laboratory, practical
            $table->text('notes')->nullable()->after('session_type');
        });

        // 3. Add operating_days to school_classes table
        Schema::table('school_classes', function (Blueprint $table) {
            $table->json('operating_days')->nullable()->after('shift');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_breaks');

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn(['session_type', 'notes']);
        });

        Schema::table('school_classes', function (Blueprint $table) {
            $table->dropColumn('operating_days');
        });
    }
};
