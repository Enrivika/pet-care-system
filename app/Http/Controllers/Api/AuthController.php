<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
public function register(Request $request)
{
    // Валидация входных данных согласно требованиям
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|unique:users',
        'password' => 'required|string|min:6|confirmed',
    ]);

    // Создание пользователя с хешированием пароля (bcrypt)
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);

    // Генерация персонального API-токена Sanctum
    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token,
    ], 201);
}

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Неверные данные для входа.'],
            ]);
        }

        // Создание нового токена при каждом успешном входе
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Выход выполнен']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'notify_email' => 'boolean',
            'notify_push' => 'boolean',
        ]);

    $user->update([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'notify_email' => $request->boolean('notify_email', true),
        'notify_push' => $request->boolean('notify_push', true),
    ]);

        return response()->json([
            'message' => 'Профиль обновлён',
            'user' => $user
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['message' => 'Неверный текущий пароль'], 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json(['message' => 'Пароль успешно изменён']);
    }

    public function forgotPassword(Request $request)
    {        
        $request->validate([
            'email' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $fail('Пожалуйста, введите корректный почтовый адрес.');
                    }
                },
            ],
        ]);

        $key = 'forgot-password:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 3)) {
                $seconds = RateLimiter::availableIn($key);
                return response()->json([
                    'message' => "Слишком много попыток. Попробуйте через {$seconds} секунд."
                ], 429);
            }

        RateLimiter::hit($key, 60); // 60 секунд = 1 минута  

        // Проверка существования аккаунта
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Аккаунт с такой почтой не обнаружен'
            ], 404);
        }

        // Генерация нового случайного пароля
        $newPassword = \Illuminate\Support\Str::random(10);

        // Обновление пароля в БД
        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($newPassword)
        ]);

        // Письмо с новым паролем на почту Пользователя
        \Illuminate\Support\Facades\Mail::raw(
            "Здравствуйте, {$user->name}!\n\n" .
            "Ваш новый пароль для входа в Petopia:\n\n" .
            "{$newPassword}\n\n" .
            "Пожалуйста, после входа обязательно смените его в настройках профиля.\n\n" .
            "С уважением,\nКоманда Petopia",
            function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Ваш новый пароль для Petopia');
            }
        );

        return response()->json([
            'message' => 'Новый пароль отправлен на вашу почту'
        ]);
    }  
}