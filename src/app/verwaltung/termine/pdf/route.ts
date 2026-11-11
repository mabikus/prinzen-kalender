import { ladeDaten } from "@/lib/daten";
import { terminplanAntwort } from "@/lib/pdf/antwort";
import { aktuellerAdmin } from "@/lib/sitzung";

// Terminplan als PDF aus der Verwaltung: ?alle=1 ganze Session, ?vertraulich=1 mit vertraulichen Terminen.
// Mit bestellten Karten (intern).
export async function GET(request: Request) {
  if (!(await aktuellerAdmin())) return new Response("Nicht angemeldet", { status: 401 });
  const p = new URL(request.url).searchParams;
  const mitVertraulichen = p.get("vertraulich") === "1";
  const daten = await ladeDaten();
  const termine = mitVertraulichen ? daten.termine : daten.termine.filter((t) => !t.vertraulich);
  return terminplanAntwort(
    { ...daten, termine },
    { alle: p.get("alle") === "1", mitBestellt: true, zusatz: mitVertraulichen ? "mit vertraulichen Terminen" : undefined },
  );
}
