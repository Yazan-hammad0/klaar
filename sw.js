// Klaar offline cache. release.py stamps VERSION; a new VERSION makes phones download everything fresh.
const VERSION = "321ede4b22";
const CACHE = "klaar-" + VERSION, FONTS = "klaar-fonts";
const SHELL = ["./", "./index.html", "./css/app.css", "./js/i18n-data.js", "./js/i18n.js", "./js/content.js", "./js/audio.js", "./js/lessons.js", "./js/view.js", "./js/map.js", "./js/glossary.js", "./js/stats.js", "./js/app.js", "./js/shell.js", "./js/setup.js", "./js/onboard.js", "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./fonts/overpass-latin.woff2"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Only the app itself is cached. The landing page (welcome/), privacy/ and marketing/ are ordinary web pages: leave them to the browser,
  // or a visit to them would overwrite the app's saved page and break opening the app offline.
  const root = new URL("./", self.location).pathname, rest = url.pathname.slice(root.length);
  if (url.pathname.indexOf(root) !== 0 || /^(welcome|privacy|marketing)\//.test(rest)) return;
  if (req.mode === "navigate" && rest !== "" && rest !== "index.html") return;
  // network first for the page (so updates arrive), cache when offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html", {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
