// Service worker: после первой загрузки приложение работает полностью без интернета.
// При каждом заметном обновлении файлов увеличивайте CACHE_VERSION — это заставит
// телефоны скачать новые файлы вместо старых из кэша.
const CACHE_VERSION = "v2";
const CACHE_NAME = "teacher-assistant-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "css/base.css",
  "css/layout.css",
  "js/app.js",
  "js/db.js",
  "js/ui.js",
  "js/theme.js",
  "js/onboarding.js",
  "js/repo.js",
  "js/screens/home.js",
  "js/screens/more.js",
  "js/screens/settings.js",
  "js/screens/install-guide.js",
  "js/screens/placeholder.js",
  "js/screens/grades.js",
  "js/screens/group-detail.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => {
          if (req.mode === "navigate") {
            return caches.match("index.html");
          }
          return cached;
        });
      return cached || network;
    })
  );
});
