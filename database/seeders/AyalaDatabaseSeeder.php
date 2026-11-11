<?php

namespace Database\Seeders;

use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AyalaDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Master Administrator Account for Ayala National High School
        User::updateOrCreate(
            ['email' => 'admin@anhs.edu.ph'],
            [
                'name' => 'Ayala NHS Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'account_status' => 'active',
            ]
        );

        // 2. Official DepEd K-12 Curriculum Subject Catalog (Grades 7–10 JHS & Grades 11–12 SHS)
        $subjectsData = [
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

        foreach ($subjectsData as $s) {
            Subject::updateOrCreate(['code' => $s['code']], $s);
        }
    }
}
