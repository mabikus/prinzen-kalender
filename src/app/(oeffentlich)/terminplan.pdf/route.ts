import { ladeDaten } from "@/lib/daten";
import { terminplanAntwort } from "@/lib/pdf/antwort";
import { istFreigeschaltet } from "@/lib/vertraulich";

// Terminplan als PDF für die Ansicht (Zugang prüft der Proxy): nur, was man sehen darf – vertrauliche Termine nur
// mit PIN, ohne bestellte Karten. ?alle=1 ganze Session.
export async function GET(request: Request) {
  const [daten, frei] = await Promise.all([ladeDaten(), istFreigeschaltet()]);
  const termine = frei ? daten.termine : daten.termine.filter((t) => !t.vertraulich);
  return terminplanAntwort({ ...daten, termine }, { alle: new URL(request.url).searchParams.get("alle") === "1" });
}
