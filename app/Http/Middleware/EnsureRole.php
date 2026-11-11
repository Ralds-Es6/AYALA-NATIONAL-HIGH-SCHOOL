<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request and ensure user has one of the allowed roles.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = Auth::user();

        // 1. Check if user is authenticated
        if (!$user) {
            return response()->json([
                'success' => false,
                'status' => 'unauthenticated',
                'message' => 'Authentication required. Please sign in to your authorized portal.',
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 401);
        }

        // 2. Check if user has one of the required roles
        if (!in_array($user->role, $roles, true)) {
            $allowedRoleList = implode(' or ', array_map('ucfirst', $roles));
            $userRole = ucfirst($user->role ?? 'User');

            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'message' => "Access Denied. This resource is restricted to {$allowedRoleList} accounts. Your account role is {$userRole}.",
                'current_role' => $user->role,
                'required_roles' => $roles,
                'character' => [
                    'expression' => 'sad',
                    'motion' => 'disappointed'
                ]
            ], 403);
        }

        return $next($request);
    }
}
