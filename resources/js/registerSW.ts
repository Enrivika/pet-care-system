// Регистрация Service Worker как ESM модуля.
// Мы сами контролируем путь и тип регистрации (type: module), потому что SW использует ESM import.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
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

// Виртуальный модуль от vite-plugin-pwa.
// Используется для обнаружения обновлений приложения (новый билд).
// registerType: 'prompt' в vite.config — значит авто-перезагрузок не будет.
// Мы сами решаем, когда перезагружать (через updateSW()).
import { registerSW } from 'virtual:pwa-register';

// ВАЖНО: immediate: false (по умолчанию), чтобы не было агрессивных проверок обновлений
// при каждом монтировании страницы. На Render каждый деплой = новый хэш в SW,
// 'autoUpdate' + immediate раньше вызывали постоянные F5.
const updateSW = registerSW({
  immediate: false,
  onNeedRefresh() {
    // Здесь можно показать красивый тост с кнопкой "Обновить приложение".
    // Для простоты — лог + опциональный confirm.
    console.log('[PWA] New content available. New version of the app is ready.');

    // Раскомментируй, если хочешь показывать confirm при наличии обновления:
    // if (confirm('Доступна новая версия Petopia. Обновить страницу?')) {
    //   updateSW(true); // true = reload after activating new SW
    // }
  },
  onOfflineReady() {
    console.log('[PWA] Application is ready to work offline.');
  },
});

// Если хочешь программно обновить приложение (например, из кнопки в профиле):
// window.updateSW = updateSW; 
// потом где-то: window.updateSW(true); 

