/* Admin ops Web Push SW — push → 처리 대기함 (/queues). No precache (INFRA-only). */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  /** @type {{ title?: string; body?: string; url?: string; tag?: string }} */
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'PHONARA';
  const url = payload.url || '/queues';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body,
      tag: payload.tag || url,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) || '/queues';
  const targetUrl = new URL(String(rawUrl), self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client && new URL(client.url).pathname === targetUrl.pathname) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl.href);
      }
      return undefined;
    }),
  );
});
