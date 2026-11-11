import { Suspense } from "react";
import { Monate } from "@/components/monate";
import { MonatSkelett } from "@/components/termin-skelett";
import { jetztZwischengespeichert } from "@/lib/daten";
import { ladeAnsicht } from "@/lib/vertraulich";

export const metadata = { title: "Monat" };

export default function MonatSeite() {
  return (
    <Suspense fallback={<MonatSkelett />}>
      <Inhalt />
    </Suspense>
  );
}

/** Zwischengespeichert, damit der Tab vorgeladen ist und ohne Wartezeit erscheint */
async function Inhalt() {
  const [{ termine, gruppen }, jetzt] = await Promise.all([ladeAnsicht(), jetztZwischengespeichert()]);
  return <Monate termine={termine} gruppen={gruppen} jetzt={jetzt} />;
}
