import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { TerminSeite } from "@/components/admin/termin-seite";
import { Page } from "@/components/ui/page";
import { ladeDaten, ladeProtokoll } from "@/lib/daten";

export const metadata = { title: "Termin" };

export default function Seite(props: PageProps<"/verwaltung/termine/[id]">) {
  return (
    <Page width="narrow">
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Inhalt {...props} />
      </Suspense>
    </Page>
  );
}

async function Inhalt({ params, searchParams }: PageProps<"/verwaltung/termine/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const daten = await ladeDaten();
  const neu = id === "neu";
  const termin = neu ? null : (daten.termine.find((t) => t.id === decodeURIComponent(id)) ?? null);
  if (!neu && !termin) notFound();
  const datum = typeof sp.datum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.datum) ? sp.datum : undefined;
  const verlauf = termin ? await ladeProtokoll({ objektId: termin.id, limit: 20 }) : [];
  return <TerminSeite termin={termin} vorlage={{ datum }} gruppen={daten.gruppen} alleTermine={daten.termine} verlauf={verlauf} />;
}
