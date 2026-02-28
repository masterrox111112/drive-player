const DRIVE_API = 'https://www.googleapis.com/drive/v3/files/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (!url.includes('googleapis.com/drive/v3/files/')) return;

  event.respondWith(
    (async () => {
      // Pega o token do cache do SW
      const cache = await caches.open('drive-token');
      const tokenResp = await cache.match('token');
      if (!tokenResp) return fetch(event.request);
      const token = await tokenResp.text();

      // Refaz a requisição com o token no header
      const newReq = new Request(event.request.url, {
        method: event.request.method,
        headers: {
          ...Object.fromEntries(event.request.headers.entries()),
          'Authorization': 'Bearer ' + token
        },
        mode: 'cors',
        credentials: 'omit'
      });

      return fetch(newReq);
    })()
  );
});

// Recebe token do cliente
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'SET_TOKEN') {
    const cache = await caches.open('drive-token');
    await cache.put('token', new Response(event.data.token));
  }
});
