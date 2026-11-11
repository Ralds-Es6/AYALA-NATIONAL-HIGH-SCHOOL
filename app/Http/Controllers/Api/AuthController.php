<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate user with strict Role-Based Access Control (RBAC).
     * Verifies both credentials AND matching portal role.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'expected_role' => ['nullable', 'string', 'in:admin,teacher,student'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        // 1. Verify Credentials
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'The provided email or password does not match our records.',
                'character' => [
                    'expression' => 'sad',
                    'motion' => 'disappointed'
                ]
            ], 422);
        }

        // 2. Account Status Check (Active vs Pending / Suspended / Rejected)
        if ($user->account_status === 'suspended') {
            return response()->json([
                'success' => false,
                'status' => 'account_suspended',
                'message' => 'This account has been suspended by the school administrator. Please contact the school administration office.',
            ], 403);
        }

        if ($user->account_status === 'pending_verification') {
            return response()->json([
                'success' => false,
                'status' => 'pending_verification',
                'message' => 'Your student account is pending documentation verification by the school administrator.',
            ], 403);
        }

        if ($user->account_status === 'rejected') {
            return response()->json([
                'success' => false,
                'status' => 'documentation_rejected',
                'message' => 'Your student supporting documentation was rejected. Please coordinate with the school administrator with valid supporting documents (e.g., COR, School ID).',
            ], 403);
        }

        // 4. Establish Authenticated Session
        Auth::login($user);
        $request->session()->regenerate();

        // Load associated profile based on role
        if ($user->role === 'teacher') {
            $user->load('teacher');
        } elseif ($user->role === 'student') {
            $user->load(['student.schoolClass']);
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Authentication successful. Welcome, {$user->name}!",
            'user' => $user,
            'must_change_password' => (bool) $user->must_change_password,
            'redirect_url' => "/{$user->role}/dashboard",
            'character' => [
                'expression' => 'happy',
                'motion' => 'celebrate'
            ]
        ]);
    }

    /**
     * Change user password (specifically required for first-time login of provisioned accounts).
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated session.',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'The provided current temporary password does not match.',
                'errors' => [
                    'current_password' => ['The current temporary password is incorrect.']
                ]
            ], 422);
        }

        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Your new permanent password must be different from your temporary password.',
                'errors' => [
                    'new_password' => ['The new permanent password cannot be identical to the temporary password.']
                ]
            ], 422);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->must_change_password = false;
        $user->save();

        if ($user->role === 'student') {
            $user->load(['student.schoolClass']);
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Permanent password successfully established! You can now proceed to your class timetable.',
            'user' => $user,
        ]);
    }

    /**
     * Get current authenticated user session.
     */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'status' => 'unauthenticated',
                'message' => 'No active authenticated session found.',
                'user' => null,
            ], 401);
        }

        if ($user->role === 'teacher') {
            $user->load('teacher');
        } elseif ($user->role === 'student') {
            $user->load(['student.schoolClass']);
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'user' => $user,
        ]);
    }

    /**
     * Quick role switcher for evaluator convenience (Admin, Teacher, Student).
     */
    public function switchDemoUser(Request $request): JsonResponse
    {
        $role = $request->input('role', 'admin');
        
        $user = User::where('role', $role)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => "No demo user found for role: {$role}",
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 404);
        }

        Auth::login($user);
        $request->session()->regenerate();

        if ($user->role === 'teacher') {
            $user->load('teacher');
        } elseif ($user->role === 'student') {
            $user->load(['student.schoolClass']);
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Switched to demo {$role} account ({$user->name}).",
            'user' => $user,
            'redirect_url' => "/{$user->role}/dashboard",
            'character' => [
                'expression' => 'happy',
                'motion' => 'celebrate'
            ]
        ]);
    }

    /**
     * Log out current session.
     */
    public function logout(Request $request): JsonResponse
    {
        $role = Auth::user()?->role ?? 'admin';

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Logged out successfully.',
            'redirect_portal' => "/{$role}/login",
            'character' => [
                'expression' => 'neutral',
                'motion' => 'idle'
            ]
        ]);
    }
}
