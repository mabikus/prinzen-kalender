// Service Worker des Sessionskalenders.
// - Seiten der Ansicht (Termine, Monat, Termin, Abo): erst Netz, sonst gespeicherte Fassung (offline lesbar)
// - Statische Dateien (/_next/static, Schriften, Icons): aus dem Speicher, sie ändern sich nie
// - Verwaltung, Anmeldung, API, Kalender-Feeds: immer nur übers Netz, nichts speichern
const VERSION = "v1";
const SEITEN = `seiten-${VERSION}`;
const DATEIEN = `dateien-${VERSION}`;
const OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SEITEN)
      .then((c) => c.addAll([OFFLINE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => ![SEITEN, DATEIEN].includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

const NIE = ["/verwaltung", "/anmelden", "/einrichtung", "/einladung", "/api/", "/kalender/"];

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NIE.some((p) => url.pathname.startsWith(p))) return;

  // Unveränderliche Dateien: Speicher zuerst
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app-icon/")) {
    event.respondWith(
      caches.open(DATEIEN).then(async (c) => {
        const treffer = await c.match(req);
        if (treffer) return treffer;
        const antwort = await fetch(req);
        if (antwort.ok) c.put(req, antwort.clone());
        return antwort;
      }),
    );
    return;
  }

  // Seitenaufrufe: Netz zuerst, Kopie merken; offline gespeicherte Fassung
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((antwort) => {
          if (antwort.ok && antwort.type === "basic") {
            const kopie = antwort.clone();
            caches.open(SEITEN).then((c) => c.put(req, kopie));
          }
          return antwort;
        })
        .catch(async () => (await caches.match(req)) ?? (await caches.match(OFFLINE)) ?? Response.error()),
    );
  }
});
