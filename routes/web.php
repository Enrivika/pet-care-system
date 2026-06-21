<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

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