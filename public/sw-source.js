
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', function(event) {
  const payload = event.data ? event.data.json() : {};
  
  const title = payload.title || (payload.notification && payload.notification.title) || 'Petopia';
  const body = payload.body || (payload.notification && payload.notification.body) || 'У вас новое уведомление';
  const icon = payload.icon || (payload.notification && payload.notification.icon) || '/images/Petopia.png';
  
  let targetUrl = '/dashboard';
  if (payload.data && payload.data.url) {
    targetUrl = payload.data.url;
  } else if (payload.notification && payload.notification.data && payload.notification.data.url) {
    targetUrl = payload.notification.data.url;
  }
 
  const options = {
    body: body,
    icon: icon,
    badge: '/images/Petopia.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: targetUrl
    }
  };
 
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
