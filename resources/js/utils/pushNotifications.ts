// resources/js/utils/pushNotifications.ts
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BHPxLisHrbOrX3HDurySLJ7LofgsVMkLyOo4v_FYNHXrtA_RMvbwhUaGyIsRnH0xNQTCtIMDIK6udtFYTsvWbGs';

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.error('Ваш браузер не поддерживает Web Push уведомления');
    return false;
  }

  try {
    // Дожидаемся готовности Service Worker.
    // PWA SW регистрируется в registerSW.ts с type: 'module'.
    // Используем ready, чтобы push-логика работала с тем же SW.
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker готов (PWA)');

    // Запрашиваем разрешение
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

    // Отправляем подписку на сервер
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (response.ok) {
      console.log('Успешно подписаны на Web Push');
      return true;
    } else {
      console.error('Ошибка подписки');
      return false;
    }
  } catch (error) {
    console.error('Ошибка при подписке на push:', error);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Удаляем подписку с сервера
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка при отписке:', error);
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