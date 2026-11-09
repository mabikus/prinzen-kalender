import { Suspense } from "react";
import { BenutzerVerwaltung } from "@/components/admin/benutzer";
import { Page } from "@/components/ui/page";
import { ladeBenutzer, offeneEinladungen } from "@/lib/benutzer";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: "Benutzer" };

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
  const a = await brauchtAdmin();
  const [benutzer, einladungen] = await Promise.all([ladeBenutzer(), offeneEinladungen()]);
  return (
    <BenutzerVerwaltung
      ich={{ id: a.id, role: a.role }}
      benutzer={benutzer}
      einladungen={einladungen.map((e) => ({ id: e.id, email: e.email, name: e.name, laeuftAb: e.laeuft_ab.toISOString() }))}
    />
  );
}
