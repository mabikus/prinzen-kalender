import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { VertraulichVerwaltung } from "@/components/admin/vertraulich";
import { Page } from "@/components/ui/page";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { ladeMarke } from "@/lib/marke-laden";
import { brauchtAdmin } from "@/lib/sitzung";
import { ladePin } from "@/lib/vertraulich";

export const metadata = { title: "Vertrauliche Termine" };

export default function Seite() {
  return (
    <Page width="narrow">
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Inhalt />
      </Suspense>
    </Page>
  );
}

async function Inhalt() {
  await brauchtAdmin();
  const [pin, daten, marke] = await Promise.all([ladePin(), ladeDaten(), ladeMarke()]);
  return (
    <VertraulichVerwaltung
      pin={pin}
      anzahl={daten.termine.filter((t) => t.vertraulich).length}
      appName={marke.name}
      speicherbar={speichernMoeglich() === true}
    />
  );
}
