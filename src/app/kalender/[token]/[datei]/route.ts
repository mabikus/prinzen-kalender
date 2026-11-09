import { ladeDaten } from "@/lib/daten";
import { kalender } from "@/lib/ics";
import { filterListe } from "@/lib/labels";
import { tokenGueltig } from "@/lib/zugang";
import { APP_NAME } from "@/lib/marke";

// Kalender-Abo: /kalender/<token>/<filter>.ics
// <filter> = "alle", eine Gruppen-ID (z. B. "senat"), "karten", "intern" oder "extern"
export async function GET(request: Request, ctx: RouteContext<"/kalender/[token]/[datei]">) {
  const { token, datei } = await ctx.params;
  if (!tokenGueltig(token)) return new Response("Nicht gefunden", { status: 404 });

  const daten = await ladeDaten();
  const key = datei.replace(/\.ics$/, "");
  const filter = filterListe(daten.gruppen).find((f) => f.key === key);
  if (!filter) return new Response("Nicht gefunden", { status: 404 });

  const ics = kalender(daten.termine.filter(filter.passt), {
    name: key === "alle" ? APP_NAME : `${APP_NAME} – ${filter.label}`,
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
