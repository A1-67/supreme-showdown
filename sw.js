const CACHE_NAME = 'showdown-v1';
// Add every local asset file your game needs to run offline
const CACHE_NAME = 'showdown-v1';
// Add every local asset file your game needs to run offline
const ASSETS_TO_CACHE = [
  'index.html',
  'main.js',
  'game.js',
  'entities.js',
  'ui.js',
  'audio.js',             // Added this file!
  'manifest.json',
  'assets/courtroom-bg.webp', // Added background asset!
  'assets/audio/court-battle.mp3',   // Added music path!
  'assets/audio/gavel-hit.mp3',       // Added sound effects paths!
  'assets/audio/cheer-applause.mp3',
  'assets/audio/super-charge.mp3',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

// Install Event: Caches all static elements
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Cleans up old caches if you update the game
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

// Fetch Event: Serves assets from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
