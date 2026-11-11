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
        // Add track and strand to school_classes
        if (Schema::hasTable('school_classes')) {
            Schema::table('school_classes', function (Blueprint $table) {
                if (!Schema::hasColumn('school_classes', 'track')) {
                    $table->string('track')->nullable()->after('grade_level'); // e.g. "Academic Track", "TVL Track"
                }
                if (!Schema::hasColumn('school_classes', 'strand')) {
                    $table->string('strand')->nullable()->after('track'); // e.g. "STEM", "HUMSS", "ABM", "GAS", "TVL-ICT"
                }
            });
        }

        // Add track and strand to students
        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (!Schema::hasColumn('students', 'track')) {
                    $table->string('track')->nullable()->after('school_class_id');
                }
                if (!Schema::hasColumn('students', 'strand')) {
                    $table->string('strand')->nullable()->after('track');
                }
            });
        }

        // Add strand to subjects (optional classification)
        if (Schema::hasTable('subjects')) {
            Schema::table('subjects', function (Blueprint $table) {
                if (!Schema::hasColumn('subjects', 'strand')) {
                    $table->string('strand')->nullable()->after('grade_level');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('school_classes')) {
            Schema::table('school_classes', function (Blueprint $table) {
                $table->dropColumn(['track', 'strand']);
            });
        }

        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn(['track', 'strand']);
            });
        }

        if (Schema::hasTable('subjects')) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->dropColumn(['strand']);
            });
        }
    }
};
