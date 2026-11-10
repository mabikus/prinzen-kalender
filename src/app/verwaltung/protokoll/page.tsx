import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { ProtokollListe } from "@/components/admin/protokoll-liste";
import { Page, PageHeader } from "@/components/ui/page";
import { ladeProtokoll } from "@/lib/daten";

export const metadata = { title: "Protokoll" };

export default function Seite() {
  return (
    <Page width="full">
      <PageHeader title="Protokoll" description="Wer hat wann was geändert (die letzten 300 Einträge)." />
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Liste />
      </Suspense>
    </Page>
  );
}

async function Liste() {
  return <ProtokollListe eintraege={await ladeProtokoll({ limit: 300 })} />;
}
