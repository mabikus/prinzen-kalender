// Einfacher Zugriffsschutz per geheimem Link.
//
// Ist ZUGANG_TOKEN gesetzt, braucht man zum Öffnen der Seite einmal den Link
// https://…/?k=<ZUGANG_TOKEN>. Danach merkt sich der Browser den Zugang (Cookie).
// Die Kalender-Abos enthalten das Token direkt in der URL.
// Ohne ZUGANG_TOKEN (lokal / Demo) ist alles offen, Abo-Token ist dann "demo".

export const COOKIE = "pk_zugang";

export function zugangsToken(): string | null {
  return process.env.ZUGANG_TOKEN?.trim() || null;
}

/** Token, das in die Abo-URLs geschrieben wird. */
export function feedToken(): string {
  return zugangsToken() ?? "demo";
}

function gleich(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function tokenGueltig(t: string | null | undefined): boolean {
  if (!t) return false;
  return gleich(t, feedToken());
}
