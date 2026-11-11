<?php

use App\Models\Assessment;
use App\Models\AssessmentGrade;
use App\Models\Schedule;
use App\Models\ScheduleNotification;
use App\Models\SchoolClass;
use App\Models\SectionBreak;
use App\Models\Student;
use App\Models\StudentFeedback;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add RBAC, Department Isolation, Qualified Subjects & Daily Cap columns to teachers
        Schema::table('teachers', function (Blueprint $table) {
            if (!Schema::hasColumn('teachers', 'department')) {
                $table->string('department', 20)->default('JHS')->after('specialization');
            }
            if (!Schema::hasColumn('teachers', 'departments')) {
                $table->json('departments')->nullable()->after('department');
            }
            if (!Schema::hasColumn('teachers', 'assigned_grade_level')) {
                $table->unsignedTinyInteger('assigned_grade_level')->default(7)->after('departments');
                $table->index('assigned_grade_level');
            }
            if (!Schema::hasColumn('teachers', 'qualified_subject_ids')) {
                $table->json('qualified_subject_ids')->nullable()->after('assigned_grade_level');
            }
            if (!Schema::hasColumn('teachers', 'permissions')) {
                $table->json('permissions')->nullable()->after('qualified_subject_ids');
            }
            if (!Schema::hasColumn('teachers', 'max_classes_per_day')) {
                $table->unsignedTinyInteger('max_classes_per_day')->default(9)->after('max_weekly_hours');
            }
            if (!Schema::hasColumn('teachers', 'temporary_password')) {
                $table->string('temporary_password', 100)->nullable()->after('max_classes_per_day');
            }
        });

        // 2. Create Audit & Assignment History Log table for Teacher RBAC (#5 Requirement)
        if (!Schema::hasTable('teacher_rbac_logs')) {
            Schema::create('teacher_rbac_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
                $table->string('action_type', 60); // account_created, department_transfer, subject_assignment, permission_update, schedule_assigned
                $table->string('summary', 500);
                $table->json('previous_state')->nullable();
                $table->json('new_state')->nullable();
                $table->string('performed_by', 120)->default('System Administrator');
                $table->timestamps();
            });
        }

        // 3. Ensure complete DepEd Subjects exist across Grades 7, 8, 9, 10 (JHS) and Grades 11, 12 (SHS)
        $completeSubjects = [
            // Grade 7 (JHS)
            ['code' => 'MATH7', 'name' => 'Mathematics 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'SCI7', 'name' => 'Science 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0D9488'],
            ['code' => 'ENG7', 'name' => 'English 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'FIL7', 'name' => 'Filipino 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#D97706'],
            ['code' => 'AP7', 'name' => 'Araling Panlipunan 7 (Asian History)', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 3, 'color' => '#EA580C'],
            ['code' => 'MAPEH7', 'name' => 'MAPEH 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'ESP7', 'name' => 'Edukasyon sa Pagpapakatao 7', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 2, 'color' => '#4F46E5'],
            ['code' => 'TLE7', 'name' => 'TLE 7 (Exploratory)', 'grade_level' => 7, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0284C7'],

            // Grade 8 (JHS)
            ['code' => 'MATH8', 'name' => 'Mathematics 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'SCI8', 'name' => 'Science 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0D9488'],
            ['code' => 'ENG8', 'name' => 'English 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'FIL8', 'name' => 'Filipino 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#D97706'],
            ['code' => 'AP8', 'name' => 'Araling Panlipunan 8 (World History)', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 3, 'color' => '#EA580C'],
            ['code' => 'MAPEH8', 'name' => 'MAPEH 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'ESP8', 'name' => 'Edukasyon sa Pagpapakatao 8', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 2, 'color' => '#4F46E5'],
            ['code' => 'TLE8', 'name' => 'TLE 8 (Technical Drafting & ICT)', 'grade_level' => 8, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0284C7'],

            // Grade 9 (JHS)
            ['code' => 'MATH9', 'name' => 'Mathematics 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'SCI9', 'name' => 'Science 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0D9488'],
            ['code' => 'ENG9', 'name' => 'English 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'FIL9', 'name' => 'Filipino 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#D97706'],
            ['code' => 'AP9', 'name' => 'Araling Panlipunan 9 (Economics)', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 3, 'color' => '#EA580C'],
            ['code' => 'MAPEH9', 'name' => 'MAPEH 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'ESP9', 'name' => 'Edukasyon sa Pagpapakatao 9', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 2, 'color' => '#4F46E5'],
            ['code' => 'TLE9', 'name' => 'TLE 9 (Specialization)', 'grade_level' => 9, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0284C7'],

            // Grade 10 (JHS)
            ['code' => 'MATH10', 'name' => 'Mathematics 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'SCI10', 'name' => 'Science 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0D9488'],
            ['code' => 'ENG10', 'name' => 'English 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'FIL10', 'name' => 'Filipino 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#D97706'],
            ['code' => 'AP10', 'name' => 'Araling Panlipunan 10 (Contemporary Issues)', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 3, 'color' => '#EA580C'],
            ['code' => 'MAPEH10', 'name' => 'MAPEH 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'ESP10', 'name' => 'Edukasyon sa Pagpapakatao 10', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 2, 'color' => '#4F46E5'],
            ['code' => 'TLE10', 'name' => 'TLE 10 (Advanced Specialization)', 'grade_level' => 10, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0284C7'],

            // Grade 11 (SHS)
            ['code' => 'GENMATH11', 'name' => 'General Mathematics', 'grade_level' => 11, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'ORALCOM11', 'name' => 'Oral Communication in Context', 'grade_level' => 11, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'EARTH11', 'name' => 'Earth & Life Science', 'grade_level' => 11, 'strand' => null, 'weekly_hours' => 4, 'color' => '#0D9488'],
            ['code' => 'EAPP11', 'name' => 'English for Academic & Prof. Purposes', 'grade_level' => 11, 'strand' => null, 'weekly_hours' => 4, 'color' => '#4F46E5'],
            ['code' => 'PRECALC11', 'name' => 'Pre-Calculus [STEM]', 'grade_level' => 11, 'strand' => 'STEM', 'weekly_hours' => 4, 'color' => '#0284C7'],
            ['code' => 'FABM11', 'name' => 'Fundamentals of ABM 1 [ABM]', 'grade_level' => 11, 'strand' => 'ABM', 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'CW11', 'name' => 'Creative Writing [HUMSS]', 'grade_level' => 11, 'strand' => 'HUMSS', 'weekly_hours' => 4, 'color' => '#E11D48'],
            ['code' => 'CSS11', 'name' => 'Computer Systems Servicing [TVL-ICT]', 'grade_level' => 11, 'strand' => 'TVL-ICT', 'weekly_hours' => 4, 'color' => '#9333EA'],
            ['code' => 'PE11', 'name' => 'HOPE 1 (PE & Health)', 'grade_level' => 11, 'strand' => null, 'weekly_hours' => 2, 'color' => '#16A34A'],

            // Grade 12 (SHS)
            ['code' => 'STAT12', 'name' => 'Statistics & Probability', 'grade_level' => 12, 'strand' => null, 'weekly_hours' => 4, 'color' => '#2563EB'],
            ['code' => 'LIT12', 'name' => '21st Century Literature', 'grade_level' => 12, 'strand' => null, 'weekly_hours' => 4, 'color' => '#7C3AED'],
            ['code' => 'PRACRES12', 'name' => 'Practical Research 2 (Quantitative)', 'grade_level' => 12, 'strand' => null, 'weekly_hours' => 4, 'color' => '#4F46E5'],
            ['code' => 'BASCALC12', 'name' => 'Basic Calculus [STEM]', 'grade_level' => 12, 'strand' => 'STEM', 'weekly_hours' => 4, 'color' => '#0284C7'],
            ['code' => 'FABM12', 'name' => 'Fundamentals of ABM 2 [ABM]', 'grade_level' => 12, 'strand' => 'ABM', 'weekly_hours' => 4, 'color' => '#059669'],
            ['code' => 'PHILPOL12', 'name' => 'Philippine Politics & Governance [HUMSS]', 'grade_level' => 12, 'strand' => 'HUMSS', 'weekly_hours' => 4, 'color' => '#E11D48'],
            ['code' => 'PROG12', 'name' => 'Computer Programming & Networking [TVL-ICT]', 'grade_level' => 12, 'strand' => 'TVL-ICT', 'weekly_hours' => 4, 'color' => '#9333EA'],
            ['code' => 'PE12', 'name' => 'HOPE 3 (PE & Health)', 'grade_level' => 12, 'strand' => null, 'weekly_hours' => 2, 'color' => '#16A34A'],
        ];

        foreach ($completeSubjects as $sub) {
            Subject::updateOrCreate(['code' => $sub['code']], $sub);
        }

        // 4. WIPE ALL DUMMY OPERATIONAL DATA FOR CLEAN-SLATE ADMIN TESTING
        // Keep ONLY the Master Administrator account (admin@anhs.edu.ph) and the Grade 7–12 Subject Catalog
        Schema::disableForeignKeyConstraints();

        if (Schema::hasTable('assessment_grades')) {
            AssessmentGrade::query()->delete();
        }
        if (Schema::hasTable('assessments')) {
            Assessment::query()->delete();
        }
        if (Schema::hasTable('student_feedbacks')) {
            StudentFeedback::query()->delete();
        }
        if (Schema::hasTable('schedule_notifications')) {
            ScheduleNotification::query()->delete();
        }
        if (Schema::hasTable('schedules')) {
            Schedule::query()->delete();
        }
        if (Schema::hasTable('teaching_loads')) {
            TeachingLoad::query()->delete();
        }
        if (Schema::hasTable('section_breaks')) {
            SectionBreak::query()->delete();
        }
        if (Schema::hasTable('students')) {
            Student::query()->delete();
        }
        if (Schema::hasTable('school_classes')) {
            SchoolClass::query()->delete();
        }
        if (Schema::hasTable('teacher_rbac_logs')) {
            DB::table('teacher_rbac_logs')->delete();
        }
        if (Schema::hasTable('teachers')) {
            Teacher::query()->delete();
        }

        // Remove all non-admin users, and ensure admin@anhs.edu.ph exists
        User::where('role', '!=', 'admin')->delete();
        User::updateOrCreate(
            ['email' => 'admin@anhs.edu.ph'],
            [
                'name' => 'Ayala NHS Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'account_status' => 'active',
            ]
        );

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_rbac_logs');
    }
};

