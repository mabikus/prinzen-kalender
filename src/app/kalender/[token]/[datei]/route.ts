import { kalender } from "@/lib/ics";
import { FILTER, istFilter } from "@/lib/labels";
import { ladeTermine } from "@/lib/termine";
import { tokenGueltig } from "@/lib/zugang";

// Kalender-Abo: /kalender/<token>/<filter>.ics
// z. B. webcal://…/kalender/abc123/alle.ics
export async function GET(request: Request, ctx: RouteContext<"/kalender/[token]/[datei]">) {
  const { token, datei } = await ctx.params;
  const filter = datei.replace(/\.ics$/, "");

  if (!tokenGueltig(token) || !istFilter(filter)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const alle = await ladeTermine();
  const auswahl = alle.filter(FILTER[filter].passt);
  const basisUrl = new URL(request.url).origin;

  const ics = kalender(auswahl, {
    name: filter === "alle" ? "Prinzen-Kalender" : `Prinzen-Kalender – ${FILTER[filter].label}`,
    basisUrl,
    alleTermine: alle,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="prinzen-kalender-${filter}.ics"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
