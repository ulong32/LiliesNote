const CACHE_NAME = "LiliesNote-cache-v1";

const urlsToCache = [
    "/",
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(r => {
            return r ? r : fetch(e.request);
        })
    );
});
