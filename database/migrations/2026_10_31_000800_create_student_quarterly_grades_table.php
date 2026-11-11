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
        Schema::create('student_quarterly_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('academic_year')->default('2026-2027');
            $table->decimal('q1', 5, 2)->nullable();
            $table->decimal('q2', 5, 2)->nullable();
            $table->decimal('q3', 5, 2)->nullable();
            $table->decimal('q4', 5, 2)->nullable();
            $table->decimal('final_rating', 5, 2)->nullable();
            $table->string('descriptor')->nullable(); // Outstanding, Very Satisfactory, Satisfactory, Fairly Satisfactory, Did Not Meet Expectations
            $table->string('remarks')->nullable();    // PASSED, FAILED, AT-RISK
            $table->boolean('is_locked')->default(false);
            $table->timestamps();

            $table->unique(
                ['student_id', 'subject_id', 'school_class_id', 'academic_year'],
                'unique_student_subject_quarterly_grade'
            );
            $table->index(['school_class_id', 'subject_id']);
            $table->index(['teacher_id', 'school_class_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_quarterly_grades');
    }
};

