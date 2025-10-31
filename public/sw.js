const CACHE_NAME = 'domain-sw-v1';
const RUNTIME_CACHE = 'runtime-v1';

self.addEventListener('install', (event) => {
  // 跳过等待，尽快接管
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (![CACHE_NAME, RUNTIME_CACHE].includes(k)) return caches.delete(k);
    })))
  );
  self.clients.claim();
});

// 对图片与 images.json 采用 cache-first；其他走默认网络
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const isImage = url.pathname.startsWith('/image/') && (request.method === 'GET');
  const isImagesList = url.pathname === '/image/images.json' && (request.method === 'GET');

  if (!(isImage || isImagesList)) return;

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (e) {
      // 失败时返回缓存兜底
      if (cached) return cached;
      throw e;
    }
  })());
});


