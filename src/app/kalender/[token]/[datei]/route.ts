import { ladeDaten } from "@/lib/daten";
import { kalender } from "@/lib/ics";
import { filterListe } from "@/lib/labels";
import { tokenGueltig } from "@/lib/zugang";
import { ladePin, vertraulichesAboToken } from "@/lib/vertraulich";
import { ladeMarke } from "@/lib/marke-laden";

// Kalender-Abo: /kalender/<token>/<filter>.ics
// <filter> = "alle", eine Gruppen-ID (z. B. "senat"), "karten", "intern" oder "extern"
export async function GET(request: Request, ctx: RouteContext<"/kalender/[token]/[datei]">) {
  const { token, datei } = await ctx.params;
  // Normales Abo: Zugangs-Token, ohne vertrauliche Termine. Mit PIN freigeschaltetes Abo: eigenes Token (aus der PIN
  // abgeleitet – neue PIN, alte vertrauliche Abos gehen nicht mehr), mit vertraulichen Terminen.
  const pin = await ladePin();
  const vertraulich = !!pin && token === vertraulichesAboToken(pin);
  if (!vertraulich && !tokenGueltig(token)) return new Response("Nicht gefunden", { status: 404 });

  const [alleDaten, marke] = await Promise.all([ladeDaten(), ladeMarke()]);
  const daten = vertraulich ? alleDaten : { ...alleDaten, termine: alleDaten.termine.filter((t) => !t.vertraulich) };
  const key = datei.replace(/\.ics$/, "");
  const filter = filterListe(daten.gruppen).find((f) => f.key === key);
  if (!filter) return new Response("Nicht gefunden", { status: 404 });

  const ics = kalender(daten.termine.filter(filter.passt), {
    name: key === "alle" ? marke.name : `${marke.name} – ${filter.label}`,
    basisUrl: new URL(request.url).origin,
    daten,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="prinzen-kalender-${key}.ics"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
