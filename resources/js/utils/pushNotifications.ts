// resources/js/utils/pushNotifications.ts
import { toast } from 'sonner';
import api from '../api/axios';

const VAPID_PUBLIC_KEY = 'BHPxLisHrbOrX3HDurySLJ7LofgsVMkLyOo4v_FYNHXrtA_RMvbwhUaGyIsRnH0xNQTCtIMDIK6udtFYTsvWbGs';

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error('Ваш браузер не поддерживает Web Push уведомления');
    return false;
  }

  try {
    // Получаем регистрацию SW без слепого await ready (который может зависнуть навсегда,
    // если SW не зарегистрирован — типичная ситуация на localhost при запуске через Laragon
    // без правильного dev/prod детекта, или после билда).
    let registration = await navigator.serviceWorker.getRegistration();

    // Если нет регистрации, НЕ ждём ready (может зависнуть). Даём понятную ошибку.
    if (!registration) {
      console.warn('[Push] Нет активной регистрации SW. Проверьте, запущен ли npm run dev (порт 5173) + бэкенд, и что SW зарегистрировался (смотри консоль [PWA]).');
      toast.error('Service Worker не зарегистрирован. Убедитесь, что вы запускаете фронтенд через "npm run dev" (на порту 5173) параллельно с бэкендом. Перезагрузите страницу и попробуйте снова.');
      return false;
    }

    // Дополнительно убедимся, что есть активный контроллер
    if (!registration.active) {
      // Подождём чуть-чуть, чтобы SW активировался (обычно быстро)
      await new Promise(r => setTimeout(r, 300));
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) {
        toast.error('Service Worker ещё не активен. Подождите секунду и попробуйте ещё раз или перезагрузите.');
        return false;
      }
    }

    console.log('[Push] Service Worker готов');

    // Запрашиваем разрешение (должно быть в контексте клика пользователя)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.error('Разрешение на уведомления отклонено. Разрешите уведомления в настройках браузера.');
      return false;
    }

    // Получаем подписку
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Отправляем подписку на сервер через общий axios (с интерцепторами и токеном)
    const response = await api.post('/push/subscribe', subscription.toJSON());

    if (response.status === 200 || response.status === 201) {
      console.log('Успешно подписаны на Web Push');
      return true;
    } else {
      console.error('Ошибка подписки на сервере');
      return false;
    }
  } catch (error: any) {
    console.error('Ошибка при подписке на push:', error);
    const msg = error?.response?.data?.message || error?.message || 'Неизвестная ошибка при подписке';
    toast.error('Ошибка подписки: ' + msg);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.ready;
    const subscription = await registration?.pushManager?.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Удаляем подписку с сервера
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });

      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Ошибка при отписке:', error);
    // Не показываем ошибку пользователю при отписке — это не критично
    return false;
  }
}

// Вспомогательная функция
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}