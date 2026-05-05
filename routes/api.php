<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\PetShareController;
use App\Http\Controllers\Api\CalendarEventController;
use Illuminate\Support\Facades\Route;

// Публичные маршруты (без авторизации)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Защищённые маршруты (требуют токен Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Выход
    Route::post('/logout', [AuthController::class, 'logout']);

    // Питомцы
    Route::apiResource('pets', PetController::class);

    // Семейный доступ к питомцу
    Route::get('pets/{pet}/shares', [PetShareController::class, 'index']);
    Route::post('pets/{pet}/shares', [PetShareController::class, 'store']);
    Route::put('pet-shares/{petShare}', [PetShareController::class, 'update']);
    Route::delete('pet-shares/{petShare}', [PetShareController::class, 'destroy']);

    // События календаря
    Route::get('pets/{pet}/events', [CalendarEventController::class, 'index']);
    Route::post('pets/{pet}/events', [CalendarEventController::class, 'store']);
    Route::get('calendar-events/{event}', [CalendarEventController::class, 'show']);
    Route::put('calendar-events/{event}', [CalendarEventController::class, 'update']);
    Route::delete('calendar-events/{event}', [CalendarEventController::class, 'destroy']);

    // Все события пользователя (для всех питомцев)
    Route::get('calendar-events', [CalendarEventController::class, 'indexAll']);

    // Выполнение задачи
    Route::patch('calendar-events/{event}/complete', [CalendarEventController::class, 'complete']);
});