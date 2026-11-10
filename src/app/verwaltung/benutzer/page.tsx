import { ladeMarke } from "@/lib/marke-laden";
import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { BenutzerVerwaltung } from "@/components/admin/benutzer";
import { Page } from "@/components/ui/page";
import { ladeBenutzer, offeneEinladungen } from "@/lib/benutzer";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: "Benutzer" };

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
  const a = await brauchtAdmin();
  const [benutzer, einladungen, marke] = await Promise.all([ladeBenutzer(), offeneEinladungen(), ladeMarke()]);
  return (
    <BenutzerVerwaltung
      ich={{ id: a.id, role: a.role }}
      appName={marke.name}
      benutzer={benutzer}
      einladungen={einladungen.map((e) => ({ id: e.id, email: e.email, name: e.name, laeuftAb: e.laeuft_ab.toISOString() }))}
    />
  );
}
