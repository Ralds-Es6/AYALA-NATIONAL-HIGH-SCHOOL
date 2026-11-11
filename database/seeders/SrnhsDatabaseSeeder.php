<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\ScheduleNotification;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SrnhsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Administrator Account
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@srnhs.edu.ph'],
            [
                'name' => 'Principal / Head Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // 2. Teachers with Users
        $teachersData = [
            [
                'employee_id' => 'MT-001',
                'name' => 'Dr. Maria Lourdes Santos',
                'email' => 'm.santos@srnhs.edu.ph',
                'contact_number' => '0917-555-0101',
                'position' => 'Master Teacher II',
                'specialization' => 'Mathematics',
                'max_weekly_hours' => 30,
            ],
            [
                'employee_id' => 'MT-002',
                'name' => 'Engr. Ricardo Dalisay',
                'email' => 'r.dalisay@srnhs.edu.ph',
                'contact_number' => '0918-555-0102',
                'position' => 'Master Teacher I',
                'specialization' => 'Science',
                'max_weekly_hours' => 30,
            ],
            [
                'employee_id' => 'T-003',
                'name' => 'Prof. Angela Reyes',
                'email' => 'a.reyes@srnhs.edu.ph',
                'contact_number' => '0919-555-0103',
                'position' => 'Teacher III',
                'specialization' => 'English',
                'max_weekly_hours' => 30,
            ],
            [
                'employee_id' => 'T-004',
                'name' => 'Mr. Joseph Bautista',
                'email' => 'j.bautista@srnhs.edu.ph',
                'contact_number' => '0920-555-0104',
                'position' => 'Teacher III',
                'specialization' => 'Filipino',
                'max_weekly_hours' => 30,
            ],
            [
                'employee_id' => 'T-005',
                'name' => 'Ms. Christine Cruz',
                'email' => 'c.cruz@srnhs.edu.ph',
                'contact_number' => '0921-555-0105',
                'position' => 'Teacher II',
                'specialization' => 'T.V.L. / ICT',
                'max_weekly_hours' => 30,
            ],
            [
                'employee_id' => 'T-006',
                'name' => 'Mr. Gabriel Mendoza',
                'email' => 'g.mendoza@srnhs.edu.ph',
                'contact_number' => '0922-555-0106',
                'position' => 'Teacher I',
                'specialization' => 'Araling Panlipunan',
                'max_weekly_hours' => 30,
            ],
        ];

        $teachers = [];
        foreach ($teachersData as $tData) {
            $user = User::updateOrCreate(
                ['email' => $tData['email']],
                [
                    'name' => $tData['name'],
                    'password' => Hash::make('password'),
                    'role' => 'teacher',
                ]
            );

            $teachers[] = Teacher::updateOrCreate(
                ['employee_id' => $tData['employee_id']],
                [
                    ...$tData,
                    'user_id' => $user->id,
                ]
            );
        }

        // 3. School Classes (Grade Sections)
        $classesData = [
            ['name' => 'Grade 7 - Diamond', 'grade_level' => 7, 'section' => 'Diamond', 'room' => 'Room 101', 'adviser_id' => $teachers[2]->id],
            ['name' => 'Grade 8 - Emerald', 'grade_level' => 8, 'section' => 'Emerald', 'room' => 'Room 102', 'adviser_id' => $teachers[3]->id],
            ['name' => 'Grade 9 - Luna', 'grade_level' => 9, 'section' => 'Luna', 'room' => 'Room 201', 'adviser_id' => $teachers[1]->id],
            ['name' => 'Grade 10 - Rizal', 'grade_level' => 10, 'section' => 'Rizal', 'room' => 'Room 202', 'adviser_id' => $teachers[0]->id],
            ['name' => 'Grade 11 - STEM A', 'grade_level' => 11, 'section' => 'STEM A', 'room' => 'Science Lab', 'adviser_id' => $teachers[4]->id],
        ];

        $classes = [];
        foreach ($classesData as $cData) {
            $classes[] = SchoolClass::updateOrCreate(['name' => $cData['name']], $cData);
        }

        // 4. Students (Admin-Verified Provisioned Accounts)
        $studentUser = User::updateOrCreate(
            ['email' => 'student@srnhs.edu.ph'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => Hash::make('password'),
                'role' => 'student',
                'must_change_password' => false,
                'account_status' => 'active',
            ]
        );

        Student::updateOrCreate(
            ['lrn' => '109283746501'],
            [
                'user_id' => $studentUser->id,
                'school_class_id' => $classes[3]->id, // Grade 10 - Rizal
                'name' => 'Juan Dela Cruz',
                'email' => 'student@srnhs.edu.ph',
                'verification_status' => 'verified',
                'document_type' => 'Certificate of Registration (COR)',
                'document_reference' => 'COR-2026-00125',
                'verified_by' => $adminUser->id,
                'verified_at' => now()->subDays(2),
            ]
        );

        // Additional sample provisioned students with diverse verification records
        $moreStudents = [
            [
                'lrn' => '109283746502', 
                'name' => 'Maria Clara Delos Santos', 
                'email' => 'm.clara@srnhs.edu.ph', 
                'class_id' => $classes[3]->id,
                'doc_type' => 'Certificate of Registration (COR)',
                'doc_ref' => 'COR-2026-00126',
                'v_status' => 'verified',
                'acc_status' => 'active'
            ],
            [
                'lrn' => '109283746503', 
                'name' => 'Jose Rizalino Mercado', 
                'email' => 'j.mercado@srnhs.edu.ph', 
                'class_id' => $classes[3]->id,
                'doc_type' => 'School-issued identification',
                'doc_ref' => 'ID-2026-00042',
                'v_status' => 'verified',
                'acc_status' => 'active'
            ],
            [
                'lrn' => '109283746504', 
                'name' => 'Ana Marie Gonzaga', 
                'email' => 'a.gonzaga@srnhs.edu.ph', 
                'class_id' => $classes[0]->id,
                'doc_type' => 'Enrollment-related document',
                'doc_ref' => 'ENR-2026-00891',
                'v_status' => 'verified',
                'acc_status' => 'active'
            ],
            [
                'lrn' => '109283746505', 
                'name' => 'Mark Kenneth Bautista', 
                'email' => 'm.bautista@srnhs.edu.ph', 
                'class_id' => $classes[2]->id,
                'doc_type' => 'Certificate of Registration (COR)',
                'doc_ref' => 'COR-2026-00412',
                'v_status' => 'verified',
                'acc_status' => 'active'
            ],
        ];

        foreach ($moreStudents as $sData) {
            $u = User::updateOrCreate(
                ['email' => $sData['email']],
                [
                    'name' => $sData['name'],
                    'password' => Hash::make('password'),
                    'role' => 'student',
                    'must_change_password' => false,
                    'account_status' => $sData['acc_status'],
                ]
            );

            Student::updateOrCreate(
                ['lrn' => $sData['lrn']],
                [
                    'user_id' => $u->id,
                    'school_class_id' => $sData['class_id'],
                    'name' => $sData['name'],
                    'email' => $sData['email'],
                    'verification_status' => $sData['v_status'],
                    'document_type' => $sData['doc_type'],
                    'document_reference' => $sData['doc_ref'],
                    'verified_by' => $sData['v_status'] === 'verified' ? $adminUser->id : null,
                    'verified_at' => $sData['v_status'] === 'verified' ? now()->subDay() : null,
                ]
            );
        }

        // 5. Subjects
        $subjectsData = [
            ['code' => 'MATH10', 'name' => 'Mathematics 10', 'grade_level' => 10, 'weekly_hours' => 4, 'color' => '#6366f1'],
            ['code' => 'SCI10', 'name' => 'Science 10', 'grade_level' => 10, 'weekly_hours' => 4, 'color' => '#06b6d4'],
            ['code' => 'ENG10', 'name' => 'English 10', 'grade_level' => 10, 'weekly_hours' => 4, 'color' => '#10b981'],
            ['code' => 'FIL10', 'name' => 'Filipino 10', 'grade_level' => 10, 'weekly_hours' => 4, 'color' => '#f59e0b'],
            ['code' => 'AP10', 'name' => 'Araling Panlipunan 10', 'grade_level' => 10, 'weekly_hours' => 3, 'color' => '#ec4899'],
            ['code' => 'TLE10', 'name' => 'T.V.L. / ICT 10', 'grade_level' => 10, 'weekly_hours' => 4, 'color' => '#8b5cf6'],
            ['code' => 'MATH9', 'name' => 'Mathematics 9', 'grade_level' => 9, 'weekly_hours' => 4, 'color' => '#6366f1'],
            ['code' => 'SCI9', 'name' => 'Science 9', 'grade_level' => 9, 'weekly_hours' => 4, 'color' => '#06b6d4'],
            ['code' => 'ENG7', 'name' => 'English 7', 'grade_level' => 7, 'weekly_hours' => 4, 'color' => '#10b981'],
            ['code' => 'FIL8', 'name' => 'Filipino 8', 'grade_level' => 8, 'weekly_hours' => 4, 'color' => '#f59e0b'],
        ];

        $subjects = [];
        foreach ($subjectsData as $sData) {
            $subjects[$sData['code']] = Subject::updateOrCreate(['code' => $sData['code']], $sData);
        }

        // 6. Teaching Loads
        $loadsData = [
            // Dr. Maria Lourdes Santos (Math)
            ['teacher_id' => $teachers[0]->id, 'subject_id' => $subjects['MATH10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 4],
            ['teacher_id' => $teachers[0]->id, 'subject_id' => $subjects['MATH9']->id, 'school_class_id' => $classes[2]->id, 'teaching_hours' => 4],
            // Engr. Ricardo Dalisay (Science)
            ['teacher_id' => $teachers[1]->id, 'subject_id' => $subjects['SCI10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 4],
            ['teacher_id' => $teachers[1]->id, 'subject_id' => $subjects['SCI9']->id, 'school_class_id' => $classes[2]->id, 'teaching_hours' => 4],
            // Prof. Angela Reyes (English)
            ['teacher_id' => $teachers[2]->id, 'subject_id' => $subjects['ENG10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 4],
            ['teacher_id' => $teachers[2]->id, 'subject_id' => $subjects['ENG7']->id, 'school_class_id' => $classes[0]->id, 'teaching_hours' => 4],
            // Mr. Joseph Bautista (Filipino)
            ['teacher_id' => $teachers[3]->id, 'subject_id' => $subjects['FIL10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 4],
            ['teacher_id' => $teachers[3]->id, 'subject_id' => $subjects['FIL8']->id, 'school_class_id' => $classes[1]->id, 'teaching_hours' => 4],
            // Ms. Christine Cruz (TLE/ICT)
            ['teacher_id' => $teachers[4]->id, 'subject_id' => $subjects['TLE10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 4],
            // Mr. Gabriel Mendoza (AP)
            ['teacher_id' => $teachers[5]->id, 'subject_id' => $subjects['AP10']->id, 'school_class_id' => $classes[3]->id, 'teaching_hours' => 3],
        ];

        $loads = [];
        foreach ($loadsData as $lData) {
            $loads[] = TeachingLoad::updateOrCreate(
                [
                    'teacher_id' => $lData['teacher_id'],
                    'subject_id' => $lData['subject_id'],
                    'school_class_id' => $lData['school_class_id'],
                    'academic_year' => '2026-2027',
                    'semester_or_quarter' => '1st Quarter',
                ],
                [
                    ...$lData,
                    'academic_year' => '2026-2027',
                    'semester_or_quarter' => '1st Quarter',
                ]
            );
        }

        // 7. Schedules (Carefully scheduled with NO conflict)
        $schedulesData = [
            // Grade 10 - Rizal (Monday)
            ['load_idx' => 0, 'day' => 'Monday', 'start' => '07:30', 'end' => '08:30', 'room' => 'Room 202'], // Math 10
            ['load_idx' => 2, 'day' => 'Monday', 'start' => '08:30', 'end' => '09:30', 'room' => 'Room 202'], // Science 10
            ['load_idx' => 4, 'day' => 'Monday', 'start' => '09:45', 'end' => '10:45', 'room' => 'Room 202'], // English 10
            ['load_idx' => 6, 'day' => 'Monday', 'start' => '10:45', 'end' => '11:45', 'room' => 'Room 202'], // Filipino 10
            ['load_idx' => 8, 'day' => 'Monday', 'start' => '13:00', 'end' => '14:00', 'room' => 'Computer Lab', 'day' => 'Monday'], // TLE 10
            ['load_idx' => 9, 'day' => 'Monday', 'start' => '14:00', 'end' => '15:00', 'room' => 'Room 202'], // AP 10

            // Grade 10 - Rizal (Tuesday)
            ['load_idx' => 0, 'day' => 'Tuesday', 'start' => '07:30', 'end' => '08:30', 'room' => 'Room 202'],
            ['load_idx' => 2, 'day' => 'Tuesday', 'start' => '08:30', 'end' => '09:30', 'room' => 'Room 202'],
            ['load_idx' => 4, 'day' => 'Tuesday', 'start' => '09:45', 'end' => '10:45', 'room' => 'Room 202'],
            ['load_idx' => 6, 'day' => 'Tuesday', 'start' => '10:45', 'end' => '11:45', 'room' => 'Room 202'],

            // Grade 10 - Rizal (Wednesday)
            ['load_idx' => 0, 'day' => 'Wednesday', 'start' => '07:30', 'end' => '08:30', 'room' => 'Room 202'],
            ['load_idx' => 2, 'day' => 'Wednesday', 'start' => '08:30', 'end' => '09:30', 'room' => 'Room 202'],
            ['load_idx' => 8, 'day' => 'Wednesday', 'start' => '13:00', 'end' => '14:00', 'room' => 'Computer Lab'],

            // Grade 9 - Luna (Monday - Dr. Santos Math 9 at 08:30 - 09:30 on Tue, no overlap)
            ['load_idx' => 1, 'day' => 'Tuesday', 'start' => '13:00', 'end' => '14:00', 'room' => 'Room 201'],
            ['load_idx' => 3, 'day' => 'Tuesday', 'start' => '14:00', 'end' => '15:00', 'room' => 'Room 201'],
            // Grade 7 - Diamond (Wednesday - Prof. Reyes English 7)
            ['load_idx' => 5, 'day' => 'Wednesday', 'start' => '10:45', 'end' => '11:45', 'room' => 'Room 101'],
            // Grade 8 - Emerald (Thursday - Mr. Bautista Filipino 8)
            ['load_idx' => 7, 'day' => 'Thursday', 'start' => '08:30', 'end' => '09:30', 'room' => 'Room 102'],
        ];

        foreach ($schedulesData as $sData) {
            $load = $loads[$sData['load_idx']];

            $schedule = Schedule::create([
                'teaching_load_id' => $load->id,
                'teacher_id' => $load->teacher_id,
                'subject_id' => $load->subject_id,
                'school_class_id' => $load->school_class_id,
                'day_of_week' => $sData['day'],
                'start_time' => $sData['start'],
                'end_time' => $sData['end'],
                'room' => $sData['room'],
            ]);

            // Seed notification logs
            ScheduleNotification::create([
                'schedule_id' => $schedule->id,
                'recipient_email' => $load->teacher->email,
                'recipient_name' => $load->teacher->name,
                'recipient_role' => 'teacher',
                'type' => 'assigned',
                'subject' => 'Schedule Assignment: ' . $load->subject->name . ' (' . $load->schoolClass->name . ')',
                'message_body' => "You have been assigned to teach {$load->subject->name} for {$load->schoolClass->name} on {$schedule->day_of_week} {$schedule->start_time}-{$schedule->end_time} in {$schedule->room}.",
                'sent_at' => now()->subMinutes(rand(10, 300)),
                'status' => 'sent',
            ]);
        }
    }
}
