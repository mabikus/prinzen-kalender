import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Callout } from "@/components/ui/callout";
import { hatDatenbank } from "@/db";
import { anzahlBenutzer } from "@/lib/benutzer";
import { EinrichtungsFormular } from "../formulare";

export const metadata = { title: "Einrichtung" };

export default function Seite() {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">Lade …</p>}>
      <Einrichtung />
    </Suspense>
  );
}

/** Nur solange es noch kein Konto gibt: Super-Admin anlegen. */
async function Einrichtung() {
  await connection();
  if (!hatDatenbank()) return <Callout tone="warning">Keine Datenbank verbunden.</Callout>;
  if ((await anzahlBenutzer()) > 0) redirect("/anmelden");
  return <EinrichtungsFormular email={process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() || null} />;
}
