<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstructorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:instructors,email'],
            'department' => ['required', 'string', 'max:100'],
            'employment_type' => ['required', 'string', 'in:Full-Time,Part-Time,Adjunct'],
            'max_units' => ['required', 'integer', 'min:3', 'max:36'],
        ];
    }
}
