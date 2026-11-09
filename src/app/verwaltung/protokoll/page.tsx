import { Suspense } from "react";
import { SeitenPlatzhalter } from "@/components/ui/laden";
import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/display";
import { Page, PageHeader } from "@/components/ui/page";
import { ladeProtokoll } from "@/lib/daten";
import { AKTION, aenderungen, zeitpunkt } from "@/lib/protokoll-text";

export const metadata = { title: "Protokoll" };

export default function Seite() {
  return (
    <Page width="narrow">
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
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
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
  );
}
