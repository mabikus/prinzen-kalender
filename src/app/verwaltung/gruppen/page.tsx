import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { GruppenVerwaltung } from "@/components/admin/gruppen";
import { Page } from "@/components/ui/page";
import { ladeDaten } from "@/lib/daten";
import { gruppeDabei } from "@/lib/labels";

export const metadata = { title: "Gruppen" };

export default function Seite() {
  return (
    <Page width="default">
      <Suspense fallback={<SeitenPlatzhalter />}>
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
