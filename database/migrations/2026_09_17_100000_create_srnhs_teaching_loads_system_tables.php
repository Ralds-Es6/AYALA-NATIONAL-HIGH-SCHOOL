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
        // 1. Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('employee_id')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('contact_number')->nullable();
            $table->string('position'); // Master Teacher I, Teacher III, Teacher II, Teacher I
            $table->string('specialization'); // Mathematics, Science, English, etc.
            $table->unsignedInteger('max_weekly_hours')->default(30);
            $table->timestamps();
        });

        // 2. School Classes (Grade Sections)
        Schema::create('school_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. "Grade 10 - Rizal"
            $table->unsignedInteger('grade_level'); // 7, 8, 9, 10, 11, 12
            $table->string('section'); // "Rizal", "Diamond"
            $table->foreignId('adviser_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('room')->nullable();
            $table->timestamps();
        });

        // 3. Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('lrn')->unique(); // Learner Reference Number
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
        });

        // 4. Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. "MATH10"
            $table->string('name'); // "Mathematics 10"
            $table->unsignedInteger('grade_level');
            $table->unsignedInteger('weekly_hours')->default(4);
            $table->string('color')->default('#6366f1');
            $table->timestamps();
        });

        // 5. Teaching Loads (Teacher + Subject + Class + Hours)
        Schema::create('teaching_loads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('academic_year')->default('2026-2027');
            $table->string('semester_or_quarter')->default('1st Quarter');
            $table->unsignedInteger('teaching_hours')->default(4);
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'subject_id', 'school_class_id', 'academic_year', 'semester_or_quarter'],
                'unique_teaching_load_assignment'
            );
        });

        // 6. Schedules (Day + Time slot + Room)
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teaching_load_id')->constrained('teaching_loads')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('day_of_week'); // Monday, Tuesday, Wednesday, Thursday, Friday
            $table->time('start_time'); // 07:30:00
            $table->time('end_time');   // 08:30:00
            $table->string('room');
            $table->timestamps();

            $table->index(['teacher_id', 'day_of_week']);
            $table->index(['school_class_id', 'day_of_week']);
            $table->index(['room', 'day_of_week']);
        });

        // 7. Schedule Notifications (Gmail dispatch logs)
        Schema::create('schedule_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->string('recipient_email');
            $table->string('recipient_name');
            $table->string('recipient_role'); // teacher, student
            $table->string('type'); // assigned, updated, changed, cancelled
            $table->string('subject');
            $table->text('message_body');
            $table->timestamp('sent_at')->nullable();
            $table->string('status')->default('sent'); // sent, queued, failed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_notifications');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('teaching_loads');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('students');
        Schema::dropIfExists('school_classes');
        Schema::dropIfExists('teachers');
    }
};
