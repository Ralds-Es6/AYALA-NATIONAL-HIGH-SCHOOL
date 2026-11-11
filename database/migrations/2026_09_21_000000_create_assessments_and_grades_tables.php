<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for assessments, grades, and feedback.
     */
    public function up(): void
    {
        // 1. Assessments Table
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('academic_year')->default('2026-2027');
            $table->string('quarter')->default('1st Quarter'); // 1st Quarter, 2nd Quarter, 3rd Quarter, 4th Quarter
            $table->string('title'); // e.g. "Quarter 1 - Written Work 1: Linear Equations"
            $table->string('type')->default('Written Work'); // Written Work, Performance Task, Quarterly Exam, Project
            $table->decimal('max_score', 8, 2)->default(50.00);
            $table->decimal('passing_score', 8, 2)->default(37.50); // DepEd standard ~75%
            $table->date('assessment_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['school_class_id', 'subject_id', 'quarter']);
            $table->index(['teacher_id', 'quarter']);
        });

        // 2. Assessment Grades (Student Scores)
        Schema::create('assessment_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('assessments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->decimal('score', 8, 2)->default(0.00);
            $table->decimal('percentage', 5, 2)->default(0.00); // Computed (score / max_score) * 100
            $table->string('status')->default('Pending'); // Passed, Failed, Pending
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['assessment_id', 'student_id'], 'unique_student_assessment_grade');
        });

        // 3. Student Feedback (Teacher notes & Academic Guidance)
        Schema::create('student_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignId('assessment_id')->nullable()->constrained('assessments')->nullOnDelete();
            $table->string('category')->default('Academic Performance'); // Academic Performance, Commendation, Improvement Needed, Attendance, General Advisory
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['student_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_feedbacks');
        Schema::dropIfExists('assessment_grades');
        Schema::dropIfExists('assessments');
    }
};
