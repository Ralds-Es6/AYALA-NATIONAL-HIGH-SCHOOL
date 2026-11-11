<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\SectionBreak;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DynamicTimetableBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Teacher $teacher;
    protected SchoolClass $class;
    protected Subject $subject;
    protected TeachingLoad $load;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->teacher = Teacher::create([
            'user_id' => $this->adminUser->id,
            'employee_id' => 'EMP-1001',
            'name' => 'Maria Santos',
            'email' => 'maria.santos@anhs.edu.ph',
            'position' => 'Teacher I',
            'specialization' => 'Mathematics',
            'status' => 'active',
        ]);

        $this->class = SchoolClass::create([
            'name' => 'Grade 7 - Diamond',
            'grade_level' => 7,
            'section' => 'Diamond',
            'max_capacity' => 45,
            'shift' => 'Whole Day Shift',
            'room' => 'Building B - Room 201',
            'operating_days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        ]);

        $this->subject = Subject::create([
            'name' => 'General Mathematics',
            'code' => 'MATH7',
            'grade_level' => 7,
            'track' => 'Junior High School',
            'color' => '#1E3A8A',
        ]);

        $this->load = TeachingLoad::create([
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'school_class_id' => $this->class->id,
            'academic_year' => '2026-2027',
            'semester_or_quarter' => '1st Quarter',
            'teaching_hours' => 5,
        ]);
    }

    public function test_can_create_schedule_with_session_type_and_notes(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/schedules', [
                'teaching_load_id' => $this->load->id,
                'day_of_week' => 'Monday',
                'start_time' => '07:30',
                'end_time' => '08:30',
                'room' => 'Building B - Room 201',
                'session_type' => 'lecture',
                'notes' => 'Diagnostic test and orientation',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '07:30',
            'end_time' => '08:30',
            'session_type' => 'lecture',
            'notes' => 'Diagnostic test and orientation',
        ]);
    }

    public function test_rejects_overlapping_schedules_in_same_section(): void
    {
        Schedule::create([
            'teaching_load_id' => $this->load->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'school_class_id' => $this->class->id,
            'day_of_week' => 'Monday',
            'start_time' => '08:00',
            'end_time' => '09:00',
            'room' => 'Building B - Room 201',
        ]);

        // Attempt overlap: 08:30 to 09:30
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/schedules', [
                'teaching_load_id' => $this->load->id,
                'day_of_week' => 'Monday',
                'start_time' => '08:30',
                'end_time' => '09:30',
                'room' => 'Building B - Room 201',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'conflict');
    }

    public function test_can_create_dynamic_multi_day_section_breaks(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/section-breaks', [
                'name' => 'Noon Lunch Break',
                'break_type' => 'lunch',
                'days' => ['Monday', 'Tuesday', 'Wednesday'],
                'start_time' => '11:30',
                'end_time' => '12:30',
                'school_class_id' => $this->class->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('section_breaks', 3);
        $this->assertDatabaseHas('section_breaks', [
            'name' => 'Noon Lunch Break',
            'day_of_week' => 'Monday',
            'school_class_id' => $this->class->id,
            'start_time' => '11:30',
            'end_time' => '12:30',
        ]);
    }

    public function test_schedule_creation_blocked_by_active_break_overlap(): void
    {
        SectionBreak::create([
            'name' => 'Noon Lunch Break',
            'break_type' => 'lunch',
            'day_of_week' => 'Tuesday',
            'start_time' => '11:30:00',
            'end_time' => '12:30:00',
            'school_class_id' => $this->class->id,
        ]);

        // Try to schedule class during lunch: 12:00 to 13:00
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/schedules', [
                'teaching_load_id' => $this->load->id,
                'day_of_week' => 'Tuesday',
                'start_time' => '12:00',
                'end_time' => '13:00',
                'room' => 'Building B - Room 201',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'conflict');
    }

    public function test_break_creation_blocked_when_overlapping_existing_class(): void
    {
        Schedule::create([
            'teaching_load_id' => $this->load->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'school_class_id' => $this->class->id,
            'day_of_week' => 'Wednesday',
            'start_time' => '09:30:00',
            'end_time' => '10:30:00',
            'room' => 'Building B - Room 201',
        ]);

        // Try to schedule morning recess from 09:30 to 09:50
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/section-breaks', [
                'name' => 'Morning Recess',
                'break_type' => 'morning',
                'day_of_week' => 'Wednesday',
                'start_time' => '09:30',
                'end_time' => '09:50',
                'school_class_id' => $this->class->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'conflict');
    }

    public function test_can_incrementally_build_and_extend_monday_timetable_beyond_4pm(): void
    {
        // 1. Add 07:30 to 08:30
        $res1 = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '07:30',
            'end_time' => '08:30',
            'room' => 'Lab 1',
        ]);
        $res1->assertStatus(201);

        // 2. Add 08:30 to 09:30
        $res2 = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '08:30',
            'end_time' => '09:30',
            'room' => 'Room 101',
        ]);
        $res2->assertStatus(201);

        // 3. Add 14:00 to 16:00 (2-hour block)
        $res3 = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '14:00',
            'end_time' => '16:00',
            'room' => 'Lab 1',
        ]);
        $res3->assertStatus(201);

        // 4. Critical requirement: Extend timetable beyond 4:00 PM (e.g. 17:00 to 18:00 / 5:00 PM to 6:00 PM)
        $res4 = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '17:00',
            'end_time' => '18:00',
            'room' => 'Room 105',
        ]);
        $res4->assertStatus(201);

        $mondaySchedules = Schedule::where('school_class_id', $this->class->id)
            ->where('day_of_week', 'Monday')
            ->orderBy('start_time')
            ->get();

        $this->assertCount(4, $mondaySchedules);
        $this->assertEquals('07:30', substr($mondaySchedules[0]->start_time, 0, 5));
        $this->assertEquals('08:30', substr($mondaySchedules[1]->start_time, 0, 5));
        $this->assertEquals('14:00', substr($mondaySchedules[2]->start_time, 0, 5));
        $this->assertEquals('17:00', substr($mondaySchedules[3]->start_time, 0, 5));
        $this->assertEquals('18:00', substr($mondaySchedules[3]->end_time, 0, 5));
    }

    public function test_modifying_monday_does_not_affect_tuesday_through_friday(): void
    {
        // Schedule Tuesday class
        $tuesdaySchedule = Schedule::create([
            'teaching_load_id' => $this->load->id,
            'teacher_id' => $this->teacher->id,
            'subject_id' => $this->subject->id,
            'school_class_id' => $this->class->id,
            'day_of_week' => 'Tuesday',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'room' => 'Room 202',
        ]);

        // Create Monday class
        $createRes = $this->actingAs($this->adminUser)->postJson('/api/v1/schedules', [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'room' => 'Room 101',
        ]);
        $createRes->assertStatus(201);
        $mondayId = $createRes->json('data.id');

        // Update Monday class to a different time
        $updateRes = $this->actingAs($this->adminUser)->putJson("/api/v1/schedules/{$mondayId}", [
            'teaching_load_id' => $this->load->id,
            'day_of_week' => 'Monday',
            'start_time' => '13:00',
            'end_time' => '14:00',
            'room' => 'Room 103',
        ]);
        $updateRes->assertStatus(200);

        // Verify Tuesday schedule remained completely untouched
        $tuesdayFresh = $tuesdaySchedule->fresh();
        $this->assertEquals('Tuesday', $tuesdayFresh->day_of_week);
        $this->assertEquals('09:00', substr($tuesdayFresh->start_time, 0, 5));
        $this->assertEquals('10:00', substr($tuesdayFresh->end_time, 0, 5));
        $this->assertEquals('Room 202', $tuesdayFresh->room);
    }
}
