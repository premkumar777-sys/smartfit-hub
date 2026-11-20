// ── SmartFit AI PWA Push Notification & Re-engagement Handler ──
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔥 SmartFit AI · Workout Reminder',
    body: 'Ready for today’s session? Your AI tailored split is waiting.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    image: '/hero-cyber-athlete.jpg',
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
    image: payload.image || '/hero-cyber-athlete.jpg',
    data: payload.data || { url: '/app/today' },
    vibrate: [200, 100, 200, 100, 200],
    tag: 'smartfit-reminder',
    renotify: true,
    actions: [
      { action: 'start', title: '🔥 Start Workout' },
      { action: 'plan', title: '📊 View Plan' },
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

  let targetPath = '/app/today';
  if (event.action === 'plan') {
    targetPath = '/dashboard';
  } else if (event.notification.data && event.notification.data.url) {
    targetPath = event.notification.data.url;
  }

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
