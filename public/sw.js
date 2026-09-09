const CACHE_NAME = "nearleo-shell-v25";
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.ico", "/nearleo-favicon-96.png", "/favicon.svg", "/nearleo-logo.svg", "/app-icon-192.png", "/app-icon-512.png", "/near-lio-carpenter.jpg", "/near-lio-tile-worker.jpg", "/near-lio-plastering-worker.jpg", "/near-lio-photographer.jpg"];

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || "Nearleo", {
    body: data.body || "You have a new update on Nearleo.",
    icon: "/app-icon-192.png", badge: "/nearleo-favicon-96.png",
    tag: data.tag || "nearleo-update", data: { url: data.url || "/?notification=messages" },
  }));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/", self.location.origin);
  if (destination.origin !== self.location.origin) return;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(destination.href); return existing.focus(); }
    return self.clients.openWindow(destination.href);
  }));
});

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put("/", copy));
      return response;
    }).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && ["style", "script", "image", "font"].includes(request.destination)) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
