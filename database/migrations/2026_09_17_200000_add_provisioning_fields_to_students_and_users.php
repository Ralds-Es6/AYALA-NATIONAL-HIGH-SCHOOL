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
        // 1. Add fields to users table
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->after('role');
            $table->string('account_status')->default('active')->after('must_change_password'); // active, pending_verification, suspended, rejected
        });

        // 2. Add verification & provisioning fields to students table
        Schema::table('students', function (Blueprint $table) {
            $table->string('verification_status')->default('verified')->after('email'); // verified, pending, rejected
            $table->string('document_type')->nullable()->after('verification_status'); // Certificate of Registration (COR), Enrollment-related document, School-issued identification, Other valid school-approved supporting documentation
            $table->string('document_reference')->nullable()->after('document_type'); // Reference or ID number (e.g. COR-2026-001)
            $table->foreignId('verified_by')->nullable()->after('document_reference')->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable()->after('verified_by');
            $table->text('rejection_reason')->nullable()->after('verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'verification_status',
                'document_type',
                'document_reference',
                'verified_by',
                'verified_at',
                'rejection_reason',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['must_change_password', 'account_status']);
        });
    }
};
