import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/display";
import { Page, PageHeader } from "@/components/ui/page";
import { Tabelle, Td, Th, Tr } from "@/components/ui/tabelle";
import { ladeProtokoll } from "@/lib/daten";
import { AKTION, aenderungen, zeitpunkt } from "@/lib/protokoll-text";

export const metadata = { title: "Protokoll" };

export default function Seite() {
  return (
    <Page width="default">
      <PageHeader title="Protokoll" description="Wer hat wann was geändert (die letzten 300 Einträge)." />
      <Suspense fallback={<SeitenPlatzhalter />}>
        <Liste />
      </Suspense>
    </Page>
  );
}

async function Liste() {
  const eintraege = await ladeProtokoll({ limit: 300 });
  if (!eintraege.length) return <EmptyState icon={<History />} title="Noch keine Änderungen" />;
  return (
    <>
      {/* PC: Tabelle mit Spalten */}
      <Tabelle>
        <thead>
          <tr>
            <Th>Zeitpunkt</Th>
            <Th>Wer</Th>
            <Th>Aktion</Th>
            <Th>Betrifft</Th>
            <Th>Änderungen</Th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map((p) => {
            const z = aenderungen(p.details);
            return (
              <Tr key={p.id}>
                <Td className="whitespace-nowrap align-top text-subtle tabular">{zeitpunkt(p.zeitpunkt)}</Td>
                <Td className="whitespace-nowrap align-top font-medium">{p.benutzer_name ?? "Unbekannt"}</Td>
                <Td className="align-top text-muted">{AKTION[p.aktion] ?? p.aktion}</Td>
                <Td className="max-w-[18rem] align-top text-accent-ink">{p.titel ?? "–"}</Td>
                <Td className="max-w-[28rem] align-top text-[12.5px] text-subtle">
                  {z.length ? z.map((zeile) => <div key={zeile}>{zeile}</div>) : "–"}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Tabelle>

      {/* Handy: Liste */}
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)] xl:hidden">
        {eintraege.map((p) => (
          <li key={p.id} className="px-4 py-3 text-[13.5px]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span>
                <strong className="font-medium">{p.benutzer_name ?? "Unbekannt"}</strong> {AKTION[p.aktion] ?? p.aktion}{" "}
                {p.titel ? <span className="text-accent-ink">„{p.titel}“</span> : null}
              </span>
              <span className="text-[12.5px] text-subtle tabular">{zeitpunkt(p.zeitpunkt)}</span>
            </div>
            {aenderungen(p.details).map((z) => (
              <div key={z} className="mt-0.5 truncate text-[12.5px] text-subtle">
                {z}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </>
  );
}
