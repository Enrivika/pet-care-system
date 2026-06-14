<?php

namespace App\Services;

use App\Models\EmailVerification;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class EmailVerificationService
{
    private const CODE_LENGTH = 6;
    private const EXPIRATION_MINUTES = 15;
    private const MAX_RESENDS_PER_10_MIN = 3;

    /**
     * Generate and send a verification code.
     * For registration, pass $registrationData = ['name' => ..., 'password' => ...]
     */
    public function sendCode(string $email, ?int $userId = null, string $type = 'registration', array $registrationData = []): ?string
    {
        // Rate limiting
        $recentCount = EmailVerification::where('email', $email)
            ->where('type', $type)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->count();

        if ($recentCount >= self::MAX_RESENDS_PER_10_MIN) {
            throw new \Exception('Слишком много попыток отправки кода. Попробуйте позже.');
        }

        // Для повторной отправки кода при регистрации пытаемся восстановить name/password из предыдущей записи
        if ($type === 'registration' && empty($registrationData)) {
            $previous = EmailVerification::where('email', $email)
                ->where('type', $type)
                ->first();

            if ($previous && $previous->name && $previous->password) {
                $registrationData = [
                    'name' => $previous->name,
                    'password' => $previous->password, // уже захеширован
                ];
            }
        }

        // Защита: для регистрации обязательно должны быть name + password (либо из запроса, либо восстановлены)
        if ($type === 'registration' && (empty($registrationData['name']) || empty($registrationData['password']))) {
            throw new \Exception('Для регистрации необходимо указать имя и пароль при первой отправке кода.');
        }

        EmailVerification::where('email', $email)
            ->where('type', $type)
            ->delete();

        $code = str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);

        $data = [
            'email'      => $email,
            'code'       => Hash::make($code),
            'user_id'    => $userId,
            'type'       => $type,
            'expires_at' => now()->addMinutes(self::EXPIRATION_MINUTES),
        ];

        if ($type === 'registration' && !empty($registrationData)) {
            // Если пароль уже захеширован (из previous), не хешируем повторно
            $isAlreadyHashed = isset($registrationData['password']) && str_starts_with($registrationData['password'], '$2y$');
            $data['name'] = $registrationData['name'];
            $data['password'] = $isAlreadyHashed
                ? $registrationData['password']
                : Hash::make($registrationData['password']);
        }

        $verification = EmailVerification::create($data);

        $isDebug = env('EMAIL_VERIFICATION_DEBUG', false) || config('mail.default') === 'log';

        if ($isDebug) {
            \Illuminate\Support\Facades\Log::info("=== [DEBUG EMAIL VERIFICATION] Код для {$email} (тип: {$type}): {$code} ===");
        }

        $subject = $type === 'registration' 
            ? 'Подтверждение регистрации в Petopia' 
            : 'Подтверждение смены email в Petopia';

        if (!$isDebug) {
            try {
                Mail::raw(
                    "Здравствуйте!\n\n" .
                    "Ваш код подтверждения: {$code}\n\n" .
                    "Код действителен в течение " . self::EXPIRATION_MINUTES . " минут.\n\n" .
                    "Если вы не запрашивали это действие, просто проигнорируйте письмо.",
                    function ($message) use ($email, $subject) {
                        $message->to($email)
                            ->subject($subject)
                            ->from(
                                config('mail.from.address'),
                                config('mail.from.name')
                            );
                    }
                );
            } catch (\Exception $mailException) {
                // Важно: удаляем запись, чтобы неудачная отправка почты
                // не расходовала лимит попыток (rate limit).
                // На Render часто бывают проблемы с Gmail SMTP (блокировка, auth и т.д.).
                $verification->delete();

                throw new \Exception(
                    'Не удалось отправить код подтверждения на email. ' .
                    'Возможно, проблема с настройками почты (Gmail часто блокирует отправку из облака). ' .
                    'Попробуйте позже или используйте другой email. ' .
                    'Детали: ' . $mailException->getMessage()
                );
            }
        }

        // Возвращаем plain code только в debug-режиме (для фронтенда на Render)
        return $isDebug ? $code : null;
    }

    /**
     * Verify code and complete the action.
     */
    public function verifyCode(string $email, string $code, string $type): array
    {
        $verification = EmailVerification::where('email', $email)
            ->where('type', $type)
            ->first();

        if (!$verification || $verification->isExpired()) {
            throw new \Exception('Код истёк или неверен.');
        }

        if (!Hash::check($code, $verification->code)) {
            throw new \Exception('Неверный код подтверждения.');
        }

        $result = [];

        if ($type === 'registration') {
            if (empty($verification->name) || empty($verification->password)) {
                throw new \Exception('Данные для регистрации не найдены или повреждены. Пожалуйста, начните регистрацию заново.');
            }

            // Create the real user now
            // Уведомления по умолчанию ВЫКЛЮЧЕНЫ — пользователь включит их сам в профиле
            $user = User::create([
                'name'               => $verification->name,
                'email'              => $verification->email,
                'password'           => $verification->password,
                'email_verified_at'  => now(),
                'notify_email'       => false,
                'notify_push'        => false,
            ]);

            $token = $user->createToken('api-token')->plainTextToken;

            $result['user'] = $user;
            $result['token'] = $token;

        } else {
            // email_change
            $user = User::findOrFail($verification->user_id);

            // Раньше здесь была дополнительная проверка владельца через auth().
            // По просьбе пользователя убрана (чтобы не было проблем с 401 и принудительным выходом).
            // Верификация кода на новый email сама по себе является доказательством контроля.

            $user->update([
                'email' => $email,
                'email_verified_at' => now(),
            ]);

            $result['user'] = $user;
        }

        $verification->delete();

        return $result;
    }
}
