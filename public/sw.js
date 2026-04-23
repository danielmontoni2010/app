const CACHE_NAME = "stm-radar-v1";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/oportunidades",
  "/alertas",
  "/metas",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pré-cacheia assets estáticos ────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Não falha o install se algum asset não existir ainda
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: limpa caches antigos ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network first, fallback para cache ─────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests que não são do mesmo origin
  if (url.origin !== location.origin) return;

  // Ignora requests de API — sempre vai à rede
  if (url.pathname.startsWith("/api/")) return;

  // Ignora requests de admin — sempre vai à rede
  if (url.pathname.startsWith("/admin")) return;

  // Para páginas: Network first, fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cacheia a resposta bem-sucedida
        if (response.ok && request.method === "GET") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta o cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback para dashboard se estiver offline
          return caches.match("/dashboard") || new Response(
            "<h1>STM Radar — Offline</h1><p>Verifique sua conexão.</p>",
            { headers: { "Content-Type": "text/html" } }
          );
        });
      })
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "STM Radar", body: event.data.text() };
  }

  const options = {
    body: data.body ?? "Nova oportunidade detectada!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag ?? "stm-radar-alert",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: { url: data.url ?? "/alertas" },
    actions: [
      { action: "view", title: "Ver alertas" },
      { action: "dismiss", title: "Ignorar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "🎯 STM Radar", options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/alertas";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Foca janela já aberta se existir
      for (const client of clientList) {
        if (client.url.includes(location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
