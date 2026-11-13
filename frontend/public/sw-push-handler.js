// ── SmartFit AI PWA Push Notification & Re-engagement Handler ──
self.addEventListener('push', (event) => {
  let payload = {
    title: 'SmartFit AI · Workout Reminder',
    body: 'Ready for today’s session? Your AI tailored split is waiting.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    data: { url: '/app/today' },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/favicon.png',
    data: payload.data || { url: '/app/today' },
    vibrate: [120, 60, 120],
    tag: 'smartfit-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Open Workout' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetPath = (event.notification.data && event.notification.data.url) || '/app/today';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetPath) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});
