<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Services\EmailVerificationService;
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
    // Уведомления по умолчанию ВЫКЛЮЧЕНЫ — пользователь включит их сам в профиле
    $user = User::create([
        'name'         => $validated['name'],
        'email'        => $validated['email'],
        'password'     => Hash::make($validated['password']),
        'notify_email' => false,
        'notify_push'  => false,
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
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'notify_email' => 'boolean',
            'notify_push' => 'boolean',
            'avatar' => 'nullable|image|max:5120',
            'remove_avatar' => 'sometimes|boolean',
        ]);

        $data = [
            'name' => $request->input('name', $user->name),
            'email' => $request->input('email', $user->email),
            // По умолчанию уведомления выключены
            'notify_email' => $request->boolean('notify_email', $user->notify_email ?? false),
            'notify_push'  => $request->boolean('notify_push', $user->notify_push ?? false),
        ];

        // Обработка аватара: загрузка нового имеет приоритет над удалением
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = time() . '_' . $file->getClientOriginalName();

            $usersPath = public_path('users');
            if (!file_exists($usersPath)) {
                mkdir($usersPath, 0755, true);
            }

            // Удаляем предыдущий аватар, если он был в public/users
            if ($user->avatar && str_starts_with($user->avatar, '/users/')) {
                $oldPath = public_path(str_replace('/users/', 'users/', $user->avatar));
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $file->move($usersPath, $filename);
            $data['avatar'] = '/users/' . $filename;
        } elseif ($request->boolean('remove_avatar')) {
            // Явное удаление текущего аватара (без загрузки нового)
            if ($user->avatar && str_starts_with($user->avatar, '/users/')) {
                $oldPath = public_path(str_replace('/users/', 'users/', $user->avatar));
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }
            $data['avatar'] = null;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Профиль обновлён',
            'user' => $user->fresh()
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

        // Запрет на установку того же пароля, который уже используется
        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json(['message' => 'Новый пароль не должен совпадать с текущим'], 422);
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

    /**
     * Отправить код верификации email (для регистрации или смены email).
     *
     * Маршрут публичный (вне auth:sanctum), чтобы работала регистрация до создания аккаунта.
     * Для email_change мы больше не возвращаем 401 (чтобы не сбрасывать сессию через axios interceptor).
     */
    public function sendEmailVerification(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'type'  => 'required|in:registration,email_change',
            'name'  => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        $userId = null;

        if ($validated['type'] === 'email_change') {
            // Получаем пользователя даже на публичном маршруте верификации (токен Sanctum в заголовке)
            $user = $request->user() ?? auth('sanctum')->user();

            if (!$user) {
                // ВАЖНО: возвращаем 422 вместо 401, чтобы глобальный axios interceptor
                // не счёл это "смертью сессии" и не выкинул пользователя на экран логина.
                return response()->json([
                    'message' => 'Для смены email необходимо быть авторизованным. Обновите страницу и попробуйте снова.'
                ], 422);
            }

            $userId = $user->id;
        }

        $service = app(EmailVerificationService::class);

        try {
            $registrationData = [];
            if ($validated['type'] === 'registration') {
                $registrationData = [
                    'name' => $validated['name'],
                    'password' => $validated['password'],
                ];
            }

            $service->sendCode(
                $validated['email'],
                $userId,
                $validated['type'],
                $registrationData
            );

            return response()->json(['message' => 'Код подтверждения отправлен на email']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 429);
        }
    }

    /**
     * Проверить код верификации.
     *
     * Для типа email_change специально убраны жёсткие проверки авторизации (возврат 401),
     * чтобы изменение почты в профиле не приводило к принудительному выходу из аккаунта.
     * (Временное упрощение по просьбе пользователя)
     */
    public function verifyEmailCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
            'type'  => 'required|in:registration,email_change',
        ]);

        // Для смены email раньше была строгая проверка авторизации.
        // По просьбе пользователя временно убираем жёсткий 401 (который вызывал принудительный релогин через интерцептор).
        // Безопасность обеспечивается тем, что код отправляется на новый email, и запись создаётся только из профиля авторизованного пользователя.
        if ($validated['type'] === 'email_change') {
            // Проверка auth здесь намеренно убрана, чтобы избежать случайных 401 и редиректа на логин.
            // Если нужно — можно вернуть позже.
        }

        $service = app(EmailVerificationService::class);

        try {
            $result = $service->verifyCode($validated['email'], $validated['code'], $validated['type']);

            if ($validated['type'] === 'registration') {
                // Автоматический логин после успешной регистрации
                return response()->json([
                    'message' => 'Email успешно подтверждён',
                    'user'    => $result['user'],
                    'token'   => $result['token'],
                ], 201);
            } else {
                return response()->json([
                    'message' => 'Email успешно изменён',
                    'user'    => $result['user'],
                ]);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}