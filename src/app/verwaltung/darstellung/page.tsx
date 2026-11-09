import { Suspense } from "react";
import { Darstellung } from "@/components/admin/darstellung";
import { Page } from "@/components/ui/page";
import { speichernMoeglich } from "@/lib/daten";
import { ladeMarke } from "@/lib/marke-laden";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: "Darstellung" };

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
  await brauchtAdmin();
  const m = await ladeMarke();
  return (
    <Darstellung
      name={m.name}
      untertitel={m.untertitel}
      logoStand={m.logoStand}
      eigenesLogo={m.eigenesLogo}
      speicherbar={speichernMoeglich()}
    />
  );
}
