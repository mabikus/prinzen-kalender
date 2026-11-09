import { Suspense } from "react";
import { GruppenVerwaltung } from "@/components/admin/gruppen";
import { Page } from "@/components/ui/page";
import { ladeDaten } from "@/lib/daten";
import { gruppeDabei } from "@/lib/labels";

export const metadata = { title: "Gruppen" };

export default function Seite() {
  return (
    <Page width="narrow">
      <Suspense fallback={<p className="text-sm text-subtle">Lade …</p>}>
        <Inhalt />
      </Suspense>
    </Page>
  );
}

async function Inhalt() {
  const daten = await ladeDaten();
  const anzahl = Object.fromEntries(daten.gruppen.map((g) => [g.id, daten.termine.filter((t) => gruppeDabei(t, g)).length]));
  return <GruppenVerwaltung gruppen={daten.gruppen} anzahl={anzahl} />;
}
