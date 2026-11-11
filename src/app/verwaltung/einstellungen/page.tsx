import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { EINSTELLUNGEN } from "@/components/admin/menue";
import { Skeleton } from "@/components/ui/display";
import { Page, PageHeader } from "@/components/ui/page";
import { ladeBenutzer } from "@/lib/benutzer";
import { ladeDaten, ladeProtokoll } from "@/lib/daten";
import { ladePin } from "@/lib/vertraulich";
import { ladeMarke } from "@/lib/marke-laden";
import { zeitpunkt } from "@/lib/protokoll-text";
import { brauchtAdmin } from "@/lib/sitzung";

export const metadata = { title: "Einstellungen" };

/** Übersicht wie KBN: je Bereich eine Karte mit Symbol, Beschreibung und kurzem Stand. */
export default function Seite() {
  return (
    <Page width="default">
      <PageHeader title="Einstellungen" description="Nur das Wichtigste – Aussehen der App, vertrauliche Termine, wer sie bedienen darf und was geändert wurde." />
      <section aria-labelledby="bereiche">
        <h2 id="bereiche" className="mb-3 px-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-subtle">
          Bereiche
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EINSTELLUNGEN.map((b) => {
            const Symbol = b.icon;
            return (
              <Link
                key={b.href}
                href={b.href}
                className="group flex h-full flex-col rounded-[var(--radius-card)] bg-panel p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[0_0_0_1px_var(--line-strong),var(--shadow-card)]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
                    <Symbol className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{b.label}</span>
                  <ChevronRight className="size-4 shrink-0 text-subtle transition-colors group-hover:text-ink" />
                </div>
                <p className="mt-2.5 flex-1 text-[13.5px] leading-snug text-muted">{b.text}</p>
                <Suspense fallback={<Skeleton className="mt-3 h-4 w-40" />}>
                  <Stand href={b.href} />
                </Suspense>
              </Link>
            );
          })}
        </div>
      </section>
    </Page>
  );
}

async function Stand({ href }: { href: string }) {
  const text = await standText(href);
  return text ? <p className="mt-3 truncate text-[12.5px] font-medium text-subtle">{text}</p> : null;
}

async function standText(href: string): Promise<string | null> {
  const a = await brauchtAdmin();
  try {
    switch (href) {
      case "/verwaltung/darstellung":
        return (await ladeMarke()).name;
      case "/verwaltung/vertraulich": {
        const [pin, daten] = await Promise.all([ladePin(), ladeDaten()]);
        const n = daten.termine.filter((t) => t.vertraulich).length;
        return pin ? `PIN gesetzt · ${n} vertraulich` : "Noch keine PIN";
      }
      case "/verwaltung/benutzer": {
        const b = await ladeBenutzer();
        const aktiv = b.filter((x) => !x.banned).length;
        const aus = b.length - aktiv;
        return `${aktiv} aktiv${aus ? ` · ${aus} deaktiviert` : ""}`;
      }
      case "/verwaltung/protokoll": {
        const [p] = await ladeProtokoll({ limit: 1 });
        return p ? `Zuletzt ${zeitpunkt(p.zeitpunkt)}` : "Noch keine Änderungen";
      }
      case "/verwaltung/konto":
        return a.email;
    }
  } catch {
    // ohne Datenbank (nur Startdaten): kein Stand
  }
  return null;
}
