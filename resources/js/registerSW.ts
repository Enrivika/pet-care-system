// Регистрация Service Worker как ESM модуля.
// Мы сами контролируем путь и тип регистрации (type: module), потому что SW использует ESM import.
if ('serviceWorker' in navigator) {
  const registerSW = (swUrl: string, scope: string = '/') => {
    navigator.serviceWorker.register(swUrl, { 
      type: 'module',
      scope
    })
      .then((registration) => {
        console.log('[PWA] Service Worker registered as module:', registration);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  };

  const register = () => {
    const isViteDev = import.meta.env.DEV && window.location.port === '5173';

    if (isViteDev) {
      // Dev on Vite port 5173: use the special dev SW from the plugin.
      registerSW('/dev-sw.js?dev-sw', '/');
      return;
    }

    // On backend port (localhost:8000 via Laravel, or Render Web Service):
    // Register /sw.js with root scope '/'.
    // This is the simple version that gave the state where registration logged "successfully"
    // for /sw.js and client subscribe succeeded ("Успешно подписаны на Web Push").
    // On 8000 the file is the source template → internal SW error about workbox-precaching is expected
    // (bare specifier can't be resolved by static server), but the subscription call itself works.
    // On Render the Dockerfile copies the processed SW into the image's public/sw.js,
    // so on Render you get the clean processed file with proper root scope and no import error.
    // Same source files, correct behavior for your workflow.
    registerSW('/sw.js', '/');
  };

  // Надёжная регистрация даже если load уже прошёл
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register);
  }
}

// Виртуальный модуль от vite-plugin-pwa.
// Используется для обнаружения обновлений приложения (новый билд).
// registerType: 'prompt' в vite.config — значит авто-перезагрузок не будет.
// Мы сами решаем, когда перезагружать (через updateSW()).
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: false,
  onNeedRefresh() {
    console.log('[PWA] New content available. New version of the app is ready.');
  },
  onOfflineReady() {
    console.log('[PWA] Application is ready to work offline.');
  },
});

// Если хочешь программно обновить приложение (например, из кнопки в профиле):
// window.updateSW = updateSW; 
// потом где-то: window.updateSW(true); 
