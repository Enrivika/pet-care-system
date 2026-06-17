<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ValidateTokenActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            return $next($request);
        }

        $accessToken = PersonalAccessToken::findToken($plainToken);

        if (! $accessToken) {
            return $next($request);
        }

        $inactivityMonths = (int) config('sanctum.inactivity_months', 3);
        $lastActivity = $accessToken->last_used_at ?? $accessToken->created_at;

        if ($lastActivity->lt(now()->subMonths($inactivityMonths))) {
            $accessToken->delete();

            return response()->json([
                'message' => 'Сессия истекла из-за длительного отсутствия. Пожалуйста, войдите снова.',
            ], 401);
        }

        return $next($request);
    }
}