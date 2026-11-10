import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { TermineListe } from "@/components/admin/termine-liste";
import { Page } from "@/components/ui/page";
import { ladeDaten } from "@/lib/daten";
import { ladeMarke } from "@/lib/marke-laden";

export const metadata = { title: "Termine" };

export default function Seite() {
  return (
    <Page width="default">
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Liste />
      </Suspense>
    </Page>
  );
}

async function Liste() {
  const [daten, marke] = await Promise.all([ladeDaten(), ladeMarke()]);
  return <TermineListe termine={daten.termine} gruppen={daten.gruppen} untertitel={marke.untertitel} />;
}
