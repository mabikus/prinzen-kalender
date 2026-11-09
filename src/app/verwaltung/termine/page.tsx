import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { TermineListe } from "@/components/admin/termine-liste";
import { Page } from "@/components/ui/page";
import { ladeDaten } from "@/lib/daten";

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
  const daten = await ladeDaten();
  return <TermineListe termine={daten.termine} gruppen={daten.gruppen} />;
}
