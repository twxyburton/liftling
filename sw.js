/* Liftling offline helper: keeps a copy of the app so it opens with no signal.
   Pages and icons are answered from the cache straight away and refreshed in the background,
   so a new index.html reaches phones on the next open. Bump VERSION only if SHELL changes. */
const VERSION = 'liftling-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './llm-worker.js', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
/* fonts and the pinned on-device AI library never change at a given URL, so they are kept once and reused */
const REFRESH_HOSTS = ['fonts.googleapis.com'];
const KEEP_HOSTS = ['fonts.gstatic.com', 'cdn.jsdelivr.net'];

/* GitHub Pages lets browsers reuse files for 10 minutes, so Liftling's own files always skip that copy
   (and check back with the server, which answers "unchanged" cheaply) to pick up a new version straight away */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, {cache:'reload'})))).then(() => self.skipWaiting()));
});

/* only clear Liftling's own old copies: the on-device AI keeps its downloaded model in caches named webllm/... */
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => /^(liftling|plates|iron-log)-/.test(k) && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin, keep = KEEP_HOSTS.includes(url.hostname);
  if (!same && !keep && !REFRESH_HOSTS.includes(url.hostname)) return;
  const nav = req.mode === 'navigate';
  const key = nav ? './index.html' : req;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(key, {ignoreSearch: nav});
    if (hit && keep) return hit;
    const fresh = fetch(same ? new Request(req.url, {cache:'no-cache', credentials:'same-origin'}) : req).then(res => {
      if ((res.ok && !res.redirected) || res.type === 'opaque') cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || Response.error();
  }));
});
