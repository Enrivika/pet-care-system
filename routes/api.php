<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\PetShareController;
use App\Http\Controllers\Api\CalendarEventController;
use App\Http\Controllers\Api\HealthRecordController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PushSubscriptionController;

// Публичные маршруты (без авторизации)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:1,1'); // 1 запрос в 1 минуту (можно настроить)

// Email верификация — публичные маршруты
// (для регистрации код отправляется до создания аккаунта)
Route::post('/email-verification/send', [AuthController::class, 'sendEmailVerification']);
Route::post('/email-verification/verify', [AuthController::class, 'verifyEmailCode']);

// Защищённые маршруты (требуют токен Sanctum)
// token.activity проверяет срок неактивности ДО обновления last_used_at Sanctum
Route::middleware(['token.activity', 'auth:sanctum'])->group(function () {

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

    // Медицинский журнал
    Route::apiResource('health-records', HealthRecordController::class);

    // Уведомления    
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/clear', [NotificationController::class, 'clearAll']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    // Обновление профиля
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/password', [AuthController::class, 'updatePassword']);

    // Web Push подписки
    Route::post('/push/subscribe', [PushSubscriptionController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);
    
});