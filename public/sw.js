// Kwacha Tracker service worker.
//
// A registered service worker with a fetch handler is what makes the app
// installable. We keep caching deliberately conservative: this is a finance app,
// so we must never serve a stale balance or someone else's cached page. The rules:
//   - Never touch non-GET requests (sign-in, server actions, deletes are POSTs).
//   - Never touch cross-origin requests (your Supabase API calls go straight out).
//   - Page navigations always hit the network when online; cache only feeds the
//     offline fallback below.
//   - Only Next's content-hashed build assets are cached, and those are immutable.

const CACHE = "kwacha-v1";
const PRECACHE = ["/icon.svg"];

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline | Kwacha Tracker</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    background:#f8fafc;color:#0f172a;padding:24px}
  .card{max-width:20rem;text-align:center}
  h1{font-size:1.1rem;margin:0 0 .5rem}
  p{font-size:.9rem;color:#475569;margin:0 0 1rem}
  button{border:0;background:#0f766e;color:#fff;padding:.6rem 1rem;border-radius:.6rem;
    font-size:.9rem;font-weight:600}
</style></head>
<body><div class="card">
  <h1>You are offline</h1>
  <p>Kwacha Tracker needs a connection to load your latest numbers.</p>
  <button onclick="location.reload()">Try again</button>
</div></body></html>`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Mutations and cross-origin (Supabase) requests pass straight through.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network first, fall back to an offline page only when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } }),
      ),
    );
    return;
  }

  // Immutable build assets: serve from cache, populate it on first hit.
  if (url.pathname.startsWith("/_next/static") || PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
