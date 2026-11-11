<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\TeachingLoad;
use Illuminate\Database\Seeder;

class TeachingLoadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Instructors
        $instructorsData = [
            [
                'name' => 'Dr. Alexander Wright',
                'email' => 'a.wright@university.edu',
                'department' => 'Computer Science',
                'employment_type' => 'Full-Time',
                'max_units' => 21,
            ],
            [
                'name' => 'Prof. Elena Rostova',
                'email' => 'e.rostova@university.edu',
                'department' => 'Information Technology',
                'employment_type' => 'Full-Time',
                'max_units' => 21,
            ],
            [
                'name' => 'Engr. Marcus Vance',
                'email' => 'm.vance@university.edu',
                'department' => 'Software Engineering',
                'employment_type' => 'Full-Time',
                'max_units' => 24,
            ],
            [
                'name' => 'Dr. Maya Lin',
                'email' => 'm.lin@university.edu',
                'department' => 'Data Science',
                'employment_type' => 'Part-Time',
                'max_units' => 12,
            ],
            [
                'name' => 'Prof. Carlos Santos',
                'email' => 'c.santos@university.edu',
                'department' => 'Computer Science',
                'employment_type' => 'Full-Time',
                'max_units' => 18,
            ],
            [
                'name' => 'Engr. Sophia Chen',
                'email' => 's.chen@university.edu',
                'department' => 'Information Technology',
                'employment_type' => 'Adjunct',
                'max_units' => 9,
            ],
        ];

        $instructors = [];
        foreach ($instructorsData as $data) {
            $instructors[] = Instructor::updateOrCreate(['email' => $data['email']], $data);
        }

        // 2. Create Courses
        $coursesData = [
            [
                'code' => 'CS101',
                'title' => 'Introduction to Computing',
                'department' => 'Computer Science',
                'lecture_hours' => 3,
                'lab_hours' => 0,
                'units' => 3,
                'description' => 'Fundamental concepts of computer science and computational thinking.',
            ],
            [
                'code' => 'CS201',
                'title' => 'Data Structures & Algorithms',
                'department' => 'Computer Science',
                'lecture_hours' => 3,
                'lab_hours' => 2,
                'units' => 4,
                'description' => 'Core data structures including trees, graphs, heaps, and algorithmic complexity.',
            ],
            [
                'code' => 'IT215',
                'title' => 'Web Systems & Technologies',
                'department' => 'Information Technology',
                'lecture_hours' => 2,
                'lab_hours' => 3,
                'units' => 3,
                'description' => 'Modern client-server web architectures, REST APIs, and modern frontend frameworks.',
            ],
            [
                'code' => 'IT310',
                'title' => 'Advanced Database Management',
                'department' => 'Information Technology',
                'lecture_hours' => 2,
                'lab_hours' => 3,
                'units' => 3,
                'description' => 'Relational database modeling, query tuning, indexing, and NoSQL engines.',
            ],
            [
                'code' => 'SE302',
                'title' => 'Software Architecture & Design',
                'department' => 'Software Engineering',
                'lecture_hours' => 3,
                'lab_hours' => 0,
                'units' => 3,
                'description' => 'Enterprise architectural styles, domain-driven design, and design patterns.',
            ],
            [
                'code' => 'DS201',
                'title' => 'Foundations of Data Science & ML',
                'department' => 'Data Science',
                'lecture_hours' => 2,
                'lab_hours' => 3,
                'units' => 3,
                'description' => 'Statistical modeling, exploratory data analysis, and predictive models.',
            ],
            [
                'code' => 'CS401',
                'title' => 'Cloud Native Systems & DevOps',
                'department' => 'Computer Science',
                'lecture_hours' => 2,
                'lab_hours' => 3,
                'units' => 3,
                'description' => 'Containerization, Kubernetes, CI/CD pipelines, and microservices.',
            ],
        ];

        $courses = [];
        foreach ($coursesData as $data) {
            $courses[] = Course::updateOrCreate(['code' => $data['code']], $data);
        }

        // 3. Assign Teaching Loads
        $loadsData = [
            [
                'instructor_id' => $instructors[0]->id, // Dr. Wright
                'course_id' => $courses[0]->id, // CS101
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSCS 1-A',
                'schedule' => 'MWF 08:30 - 09:30 AM',
                'room' => 'Hall 101',
                'status' => 'Approved',
            ],
            [
                'instructor_id' => $instructors[0]->id, // Dr. Wright
                'course_id' => $courses[1]->id, // CS201
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSCS 2-A',
                'schedule' => 'TTH 09:00 - 11:30 AM',
                'room' => 'Lab 301',
                'status' => 'Approved',
            ],
            [
                'instructor_id' => $instructors[0]->id, // Dr. Wright
                'course_id' => $courses[6]->id, // CS401
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSCS 4-A',
                'schedule' => 'MWF 01:00 - 02:30 PM',
                'room' => 'Cloud Lab 2',
                'status' => 'Assigned',
            ],
            [
                'instructor_id' => $instructors[1]->id, // Prof. Rostova
                'course_id' => $courses[2]->id, // IT215
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSIT 2-A',
                'schedule' => 'MWF 10:00 - 11:30 AM',
                'room' => 'Web Dev Lab',
                'status' => 'Approved',
            ],
            [
                'instructor_id' => $instructors[1]->id, // Prof. Rostova
                'course_id' => $courses[3]->id, // IT310
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSIT 3-A',
                'schedule' => 'TTH 01:00 - 03:30 PM',
                'room' => 'Database Lab',
                'status' => 'Approved',
            ],
            [
                'instructor_id' => $instructors[2]->id, // Engr. Vance
                'course_id' => $courses[4]->id, // SE302
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSSE 3-A',
                'schedule' => 'MWF 03:00 - 04:30 PM',
                'room' => 'Room 408',
                'status' => 'Approved',
            ],
            [
                'instructor_id' => $instructors[3]->id, // Dr. Lin
                'course_id' => $courses[5]->id, // DS201
                'academic_year' => '2026-2027',
                'semester' => '1st Semester',
                'section' => 'BSDS 2-A',
                'schedule' => 'SAT 08:00 - 01:00 PM',
                'room' => 'Data Science Lab',
                'status' => 'Assigned',
            ],
        ];

        foreach ($loadsData as $load) {
            TeachingLoad::updateOrCreate(
                [
                    'instructor_id' => $load['instructor_id'],
                    'course_id' => $load['course_id'],
                    'section' => $load['section'],
                    'academic_year' => $load['academic_year'],
                    'semester' => $load['semester'],
                ],
                $load
            );
        }
    }
}
