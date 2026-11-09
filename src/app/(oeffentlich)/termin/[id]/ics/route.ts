import { ladeDaten } from "@/lib/daten";
import { kalender } from "@/lib/ics";

// Einzelnen Termin als .ics herunterladen ("In meinen Kalender übernehmen")
export async function GET(request: Request, ctx: RouteContext<"/termin/[id]/ics">) {
  const { id } = await ctx.params;
  const daten = await ladeDaten();
  const termin = daten.termine.find((t) => t.id === id);
  if (!termin) return new Response("Nicht gefunden", { status: 404 });

  const ics = kalender([termin], { name: termin.titel, basisUrl: new URL(request.url).origin, daten });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
