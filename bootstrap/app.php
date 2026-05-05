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
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->withSchedule(function (Schedule $schedule) {
        // Запуск команды отправки напоминаний каждые 5 минут
        $schedule->command('reminders:send')->everyFiveMinutes();
    })
    ->withSchedule(function (Schedule $schedule) {
        // Автоматический перенос просроченных задач в «Историю»
        $schedule->command('tasks:mark-overdue')->everyFiveMinutes();
    })
    ->create();