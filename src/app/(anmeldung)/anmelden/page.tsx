import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Callout } from "@/components/ui/callout";
import { hatDatenbank } from "@/db";
import { anzahlBenutzer } from "@/lib/benutzer";
import { aktuellerAdmin } from "@/lib/sitzung";
import { AnmeldeFormular } from "../formulare";

export const metadata = { title: "Anmelden" };

export default function Seite({ searchParams }: PageProps<"/anmelden">) {
  return (
    <Suspense fallback={<p className="text-sm text-subtle">Lade …</p>}>
      <Anmelden searchParams={searchParams} />
    </Suspense>
  );
}

async function Anmelden({ searchParams }: Pick<PageProps<"/anmelden">, "searchParams">) {
  const sp = await searchParams;
  const weiter = typeof sp.weiter === "string" ? sp.weiter : "/verwaltung";
  if (!hatDatenbank())
    return <Callout tone="warning">Die Anmeldung ist erst möglich, wenn die Datenbank verbunden ist.</Callout>;
  if ((await anzahlBenutzer()) === 0) redirect("/einrichtung");
  if (await aktuellerAdmin()) redirect(weiter.startsWith("/") && !weiter.startsWith("//") ? weiter : "/verwaltung");
  return <AnmeldeFormular weiter={weiter} />;
}
