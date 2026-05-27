const CACHE_NAME = 'showdown-v3.1';
const ASSETS_TO_CACHE = [
  'index.html',
  'main.js',
  'game.js',
  'entities.js',
  'ui.js',
  'audio.js',
  'manifest.json',
  'assets/courtroom-bg.png',
  'assets/audio/court-battle.mp3',
  'assets/audio/gavel-hit.mp3',
  'assets/audio/super-charge.mp3',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
