import { Suspense } from "react";
import { Kalender } from "@/components/kalender/kalender";
import type { Ansicht } from "@/components/kalender/geometrie";
import { ladeDaten } from "@/lib/daten";

export const metadata = { title: "Kalender" };

export default function Seite({ searchParams }: PageProps<"/verwaltung/kalender">) {
  return (
    <Suspense fallback={<div className="grid h-full place-items-center text-sm text-subtle">Lade Kalender …</div>}>
      <Inhalt searchParams={searchParams} />
    </Suspense>
  );
}

async function Inhalt({ searchParams }: Pick<PageProps<"/verwaltung/kalender">, "searchParams">) {
  const sp = await searchParams;
  const daten = await ladeDaten();
  const ansicht: Ansicht = sp.ansicht === "tag" || sp.ansicht === "monat" ? sp.ansicht : "woche";
  const datum = typeof sp.datum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.datum) ? sp.datum : null;
  return (
    <div className="h-full">
      <Kalender termine={daten.termine} gruppen={daten.gruppen} startAnsicht={ansicht} startDatum={datum} />
    </div>
  );
}
