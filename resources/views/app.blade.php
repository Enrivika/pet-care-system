<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Petopia') }}</title>

        <!-- Fonts -->
        <!-- Шрифты -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Itim&display=swap" rel="stylesheet">

        <!-- PWA Manifest -->
        <!-- 
          В dev лучше открывать приложение по адресу Vite (http://localhost:5173) — там плагин сам инжектит манифест.
          Ссылка ниже помогает, когда ты открываешь через Laravel (порт 8000) после `npm run build`.
        -->
        <link rel="manifest" href="/build/manifest.webmanifest">

        <!-- Vite -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/main.tsx'])
    </head>
    <body class="font-sans antialiased">
        <div id="root"></div>
    </body>
</html>