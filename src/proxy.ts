import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { APP_DOMAIN } from "@/lib/marke";
import { COOKIE, tokenGueltig, zugangsToken } from "@/lib/zugang";

/** Im Produktivbetrieb nur eine Adresse (Passkeys/Cookies gelten je Domain) – andere dorthin umleiten. */
function hauptHost(): string | null {
  if (process.env.VERCEL_ENV !== "production") return null;
  if (process.env.BETTER_AUTH_URL) return new URL(process.env.BETTER_AUTH_URL).host;
  return APP_DOMAIN;
}

// Grobe Vorprüfung vor jeder Seite (die echte Prüfung machen Seiten und Aktionen selbst):
// - Verwaltung: ohne Anmelde-Cookie zur Anmeldung
// - Ansicht: geheimer Zugangslink (ZUGANG_TOKEN)
// - Anmeldung, Einrichtung, Einladung und /api/auth sind ohne Zugangslink erreichbar

const OHNE_ZUGANG = ["/anmelden", "/einrichtung", "/einladung", "/api/auth"];

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const haupt = hauptHost();
  const host = request.headers.get("host");
  if (haupt && host && host !== haupt && !url.pathname.startsWith("/api/")) {
    const ziel = new URL(url.pathname + url.search, `https://${haupt}`);
    return NextResponse.redirect(ziel, 308);
  }
  if (url.pathname.startsWith("/verwaltung")) {
    if (getSessionCookie(request, { cookiePrefix: "pk" })) return NextResponse.next();
    const ziel = new URL("/anmelden", request.url);
    ziel.searchParams.set("weiter", url.pathname + url.search);
    return NextResponse.redirect(ziel);
  }

  if (OHNE_ZUGANG.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return NextResponse.next();
  // Nur der Zugangs-Cookie zählt (ein Anmelde-Cookie ließe sich hier nicht prüfen). Nach der Anmeldung
  // setzt die App den Zugangs-Cookie für Administratoren mit (src/lib/zugang-cookie.ts).
  if (!zugangsToken()) return NextResponse.next();

  // Einladungslink ?k=… -> Cookie setzen und Token aus der Adresse entfernen
  const k = url.searchParams.get("k");
  if (k !== null) {
    url.searchParams.delete("k");
    if (!tokenGueltig(k)) return NextResponse.rewrite(new URL("/kein-zugang", request.url));
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, k, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
    return res;
  }

  if (tokenGueltig(request.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/kein-zugang", request.url));
}

export const config = {
  matcher: [
    // Alles außer statischen Dateien, Kalender-Feeds (eigenes Token) und der Hinweisseite
    "/((?!_next/static|_next/image|kalender/|kein-zugang|offline|sw\\.js|app-icon|icon|apple-icon|manifest|robots\\.txt).*)",
  ],
};
