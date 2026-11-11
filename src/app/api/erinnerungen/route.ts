import { erinnerungenVerschicken } from "@/lib/push";

// Vercel-Cron (vercel.json, alle 5 Minuten): fällige Erinnerungen vor Terminen verschicken.
// Mit CRON_SECRET in Vercel nimmt der Endpunkt nur Aufrufe von Vercel an (Header „Authorization: Bearer …“).
// Ohne ist ein fremder Aufruf harmlos: Er verschickt nur, was ohnehin fällig ist – und jede Erinnerung nur einmal.
export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET;
  if (geheim && request.headers.get("authorization") !== `Bearer ${geheim}`) return new Response("Nicht erlaubt", { status: 401 });
  const ergebnis = await erinnerungenVerschicken();
  return Response.json(ergebnis, { headers: { "Cache-Control": "no-store" } });
}
