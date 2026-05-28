<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA Catch-All Routes
|--------------------------------------------------------------------------
|
| This application is a React SPA. All non-API routes should return the
| main Blade view (app.blade.php), which then bootstraps the React app.
|
| React Router then handles client-side routing.
|
| IMPORTANT:
| - Always access the app through Laragon (Apache), not directly via
|   Vite (localhost:5173) or `php artisan serve` if you want hard refresh
|   on client routes (e.g. /pets) to work without 404.
| - API routes are handled separately in routes/api.php (prefixed with /api).
*/

Route::get('/', function () {
    return view('app');
});

// Catch-all for React Router (SPA history mode)
// This must be the last route in web.php
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|build|hot|storage|robots\.txt|favicon\.ico).*$');