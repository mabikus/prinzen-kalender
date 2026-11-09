import { Suspense } from "react";
import { Monate } from "@/components/monate";
import { ladeDaten } from "@/lib/daten";
import { jetztInBerlin } from "@/lib/zeit";

export const metadata = { title: "Monat" };

export default function MonatSeite() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade Monate …</p>}>
      <Inhalt />
    </Suspense>
  );
}

async function Inhalt() {
  const { termine } = await ladeDaten(); // vor new Date() – wartet auf die Anfrage
  return <Monate termine={termine} jetzt={jetztInBerlin()} />;
}
