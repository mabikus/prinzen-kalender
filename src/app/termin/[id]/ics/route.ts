import { kalender } from "@/lib/ics";
import { ladeTermine } from "@/lib/termine";

// Einzelnen Termin als .ics herunterladen ("In meinen Kalender übernehmen")
export async function GET(request: Request, ctx: RouteContext<"/termin/[id]/ics">) {
  const { id } = await ctx.params;
  const alle = await ladeTermine();
  const termin = alle.find((t) => t.id === id);
  if (!termin) return new Response("Nicht gefunden", { status: 404 });

  const ics = kalender([termin], {
    name: termin.titel,
    basisUrl: new URL(request.url).origin,
    alleTermine: alle,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
