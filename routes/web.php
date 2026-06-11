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

// Explicit routes for main SPA pages (React Router handles the rest inside the app).
// These ensure that hard refreshes on /pets, /dashboard etc. always get the
// app shell even in some dev server setups.
Route::get('/dashboard', fn () => view('app'));
Route::get('/pets', fn () => view('app'));
Route::get('/calendar', fn () => view('app'));
Route::get('/health', fn () => view('app'));

// Auth pages (also client-routed)
Route::get('/login', fn () => view('app'));
Route::get('/register', fn () => view('app'));
Route::get('/auth', fn () => view('app'));

// Catch-all for any other React Router paths (must stay last)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api|build|hot|storage|robots\.txt|favicon\.ico).*$');