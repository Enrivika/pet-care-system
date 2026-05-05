<?php

use Illuminate\Support\Facades\Route;

// Главная страница — загружает React-приложение
Route::get('/', function () {
    return view('app');
});

// Все остальные пути тоже загружают React (SPA)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');