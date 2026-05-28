import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.tsx'],
            refresh: true,
        }),
        react({
            jsxRuntime: 'automatic',
        }),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
        },

        // SPA fallback для удобства разработки.
        // Позволяет делать hard refresh на клиентских маршрутах (/pets, /calendar и т.д.),
        // даже если открывать приложение напрямую через порт Vite (localhost:5173).
        // ВАЖНО: Для наиболее стабильной работы рекомендуется использовать Laragon (Apache).
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.method !== 'GET') return next();

                // Пропускаем внутренние пути Vite, API и файлы с расширениями
                if (
                    req.url.startsWith('/@') ||
                    req.url.startsWith('/api') ||
                    req.url.startsWith('/hot') ||
                    /\.[a-z0-9]+$/i.test(req.url)
                ) {
                    return next();
                }

                // Перенаправляем все остальные GET-запросы на index.html
                req.url = '/index.html';
                next();
            });
        },
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
});