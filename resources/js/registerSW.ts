// Регистрация Service Worker как ESM модуля.
// Мы сами контролируем путь и тип регистрации, чтобы избежать ошибок MIME и bare imports.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ключевой момент:
    // - Когда приложение открыто через Vite dev server (порт 5173) — используем специальный dev SW от плагина.
    //   Он виртуальный и правильно обрабатывает все импорты.
    // - Когда открыто через Laravel (порт 8000) — используем обработанный SW из билда.
    //   Для этого достаточно один раз выполнить `npm run build` (файл public/build/sw.js появится).
    const isViteDev = import.meta.env.DEV && window.location.port === '5173';
    const swUrl = isViteDev 
      ? '/dev-sw.js?dev-sw' 
      : '/build/sw.js';

    navigator.serviceWorker.register(swUrl, { 
      type: 'module' 
    })
      .then((registration) => {
        console.log('[PWA] Service Worker registered as module:', registration);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Виртуальный модуль от плагина — используется только для обработки обновлений приложения
// (кнопка "обновить" при выходе новой версии и т.д.). Сама регистрация у нас ручная выше.
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New content available. Refresh the page to update.');
  },
  onOfflineReady() {
    console.log('[PWA] Application is ready to work offline.');
  },
});
