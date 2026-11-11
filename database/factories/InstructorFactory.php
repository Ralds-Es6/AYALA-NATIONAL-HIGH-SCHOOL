<?php

namespace Database\Factories;

use App\Models\Instructor;
use Illuminate\Database\Eloquent\Factories\Factory;

class InstructorFactory extends Factory
{
    protected $model = Instructor::class;

    public function definition(): array
    {
        $departments = [
            'Computer Science',
            'Information Technology',
            'Software Engineering',
            'Mathematics',
            'Data Science',
        ];

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'department' => fake()->randomElement($departments),
            'employment_type' => fake()->randomElement(['Full-Time', 'Part-Time', 'Adjunct']),
            'max_units' => fake()->randomElement([18, 21, 24]),
        ];
    }
}
