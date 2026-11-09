import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenGueltig, zugangsToken } from "@/lib/zugang";

export function proxy(request: NextRequest) {
  if (!zugangsToken()) return NextResponse.next();

  const url = request.nextUrl;
  const k = url.searchParams.get("k");

  // Einladungslink ?k=… -> Cookie setzen und Token aus der Adresse entfernen
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
    "/((?!_next/static|_next/image|kalender/|kein-zugang|icon|apple-icon|manifest|robots\\.txt).*)",
  ],
};
