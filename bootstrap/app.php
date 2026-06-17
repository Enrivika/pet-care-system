<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // Sanctum (SPA-аутентификации)
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // CORS (чтобы фронтенд мог обращаться к API)
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // Trust proxies — критично для Render (и любого облака за load balancer)
        // Чтобы корректно определялся https, реальный IP клиента и APP_URL.
        $middleware->trustProxies(at: '*');

        // Алиасы middleware (если нужно)
        $middleware->alias([
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'token.activity' => \App\Http\Middleware\ValidateTokenActivity::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->withSchedule(function (Schedule $schedule) {
        // Напоминания (email + push) — каждую минуту
        $schedule->command('reminders:send')->everyMinute();

        // Авто-завершение просроченных задач + создание следующих повторений
        $schedule->command('tasks:mark-overdue')->everyMinute();

        // Удаление токенов, не использовавшихся более 3 месяцев
        $schedule->command('tokens:prune-inactive')->daily();
    })
    ->create();