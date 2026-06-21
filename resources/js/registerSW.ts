// Регистрация Service Worker как ESM модуля.
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
      registerSW('/dev-sw.js?dev-sw', '/');
      return;
    }
    registerSW('/sw.js', '/');
  };

  // Надёжная регистрация даже если load уже прошёл
  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register);
  }
}

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
