<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        $courses = [
            ['CS101', 'Introduction to Computing', 'Computer Science', 3, 0, 3],
            ['CS102', 'Data Structures & Algorithms', 'Computer Science', 3, 2, 4],
            ['IT211', 'Web Systems & Technologies', 'Information Technology', 2, 3, 3],
            ['IT214', 'Database Management Systems', 'Information Technology', 2, 3, 3],
            ['SE301', 'Software Engineering Fundamentals', 'Software Engineering', 3, 0, 3],
            ['MATH201', 'Discrete Mathematics', 'Mathematics', 3, 0, 3],
            ['DS205', 'Data Analysis with Python', 'Data Science', 2, 3, 3],
            ['CS308', 'Operating Systems & System Programming', 'Computer Science', 3, 2, 4],
        ];

        $course = fake()->unique()->randomElement($courses);

        return [
            'code' => $course[0],
            'title' => $course[1],
            'department' => $course[2],
            'lecture_hours' => $course[3],
            'lab_hours' => $course[4],
            'units' => $course[5],
            'description' => fake()->sentence(),
        ];
    }
}
