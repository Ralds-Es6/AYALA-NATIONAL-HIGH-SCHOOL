<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\TeachingLoad;
use Illuminate\Database\Eloquent\Factories\Factory;

class TeachingLoadFactory extends Factory
{
    protected $model = TeachingLoad::class;

    public function definition(): array
    {
        return [
            'instructor_id' => Instructor::factory(),
            'course_id' => Course::factory(),
            'academic_year' => '2026-2027',
            'semester' => '1st Semester',
            'section' => fake()->randomElement(['BSCS 1-A', 'BSCS 2-B', 'BSIT 3-A', 'BSIT 4-B', 'BSSE 2-A']),
            'schedule' => fake()->randomElement([
                'MWF 07:30 - 08:30 AM',
                'MWF 09:00 - 10:30 AM',
                'MWF 01:00 - 02:30 PM',
                'TTH 08:00 - 10:00 AM',
                'TTH 01:00 - 03:00 PM',
                'SAT 08:00 - 12:00 PM',
            ]),
            'room' => fake()->randomElement(['Room 302', 'Lab 1', 'Lab 4', 'Lecture Hall B', 'Room 405']),
            'status' => fake()->randomElement(['Assigned', 'Approved', 'Draft']),
        ];
    }
}
