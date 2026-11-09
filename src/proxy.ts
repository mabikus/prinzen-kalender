import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenGueltig, zugangsToken } from "@/lib/zugang";

// Grobe Vorprüfung vor jeder Seite (die echte Prüfung machen Seiten und Aktionen selbst):
// - Verwaltung: ohne Anmelde-Cookie zur Anmeldung
// - Ansicht: geheimer Zugangslink (ZUGANG_TOKEN)
// - Anmeldung, Einrichtung, Einladung und /api/auth sind ohne Zugangslink erreichbar

const OHNE_ZUGANG = ["/anmelden", "/einrichtung", "/einladung", "/api/auth"];

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
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
