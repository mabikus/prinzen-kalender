"use client";

import { Command } from "cmdk";
import { Dialog as D } from "radix-ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarPlus, CircleUser, Eye, FileText } from "lucide-react";
import { paletteTermine } from "@/app/verwaltung/aktionen";
import { datumKurz } from "@/lib/zeit";
import { NAV } from "./menue";

type T = { id: string; titel: string; datum: string; ort: string | null };

/** ⌘K: Seiten, Aktionen und Termine durchsuchen. */
export function Befehlspalette({ offen, setOffen }: { offen: boolean; setOffen: (v: boolean) => void }) {
  const router = useRouter();
  const [termine, setTermine] = useState<T[] | null>(null);

  useEffect(() => {
    if (offen && termine === null) void paletteTermine().then((r) => r.ok && setTermine(r.daten));
  }, [offen, termine]);

  const geh = (href: string) => {
    setOffen(false);
    router.push(href);
  };

  const eintrag =
    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-ink data-[selected=true]:bg-hover [&_svg]:size-4 [&_svg]:text-subtle";
  const gruppe =
    "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-subtle";

  return (
    <D.Root open={offen} onOpenChange={setOffen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-[var(--radius-dialog)] bg-elevated shadow-[var(--shadow-pop)] outline-none">
          <D.Title className="sr-only">Suchen</D.Title>
          <D.Description className="sr-only">Seiten, Aktionen und Termine durchsuchen</D.Description>
          <Command label="Befehlspalette" loop>
            <Command.Input
              autoFocus
              placeholder="Termin, Seite oder Aktion suchen …"
              className="h-12 w-full border-b border-line bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-subtle"
            />
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-subtle">Nichts gefunden.</Command.Empty>
              <Command.Group heading="Aktionen" className={gruppe}>
                <Command.Item className={eintrag} onSelect={() => geh("/verwaltung/termine/neu")}>
                  <CalendarPlus />
                  Neuer Termin
                </Command.Item>
                <Command.Item className={eintrag} onSelect={() => geh("/verwaltung/konto")}>
                  <CircleUser />
                  Mein Konto
                </Command.Item>
                <Command.Item className={eintrag} onSelect={() => geh("/")}>
                  <Eye />
                  Ansicht öffnen
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Seiten" className={gruppe}>
                {NAV.flatMap((g) => g.eintraege).map((e) => (
                  <Command.Item key={e.href} className={eintrag} onSelect={() => geh(e.href)}>
                    <e.icon />
                    {e.label}
                  </Command.Item>
                ))}
              </Command.Group>
              {termine?.length ? (
                <Command.Group heading="Termine" className={gruppe}>
                  {termine.map((t) => (
                    <Command.Item
                      key={t.id}
                      value={`${t.titel} ${t.datum} ${datumKurz(t.datum)} ${t.ort ?? ""}`}
                      className={eintrag}
                      onSelect={() => geh(`/verwaltung/termine/${encodeURIComponent(t.id)}`)}
                    >
                      <FileText />
                      <span className="min-w-0 flex-1 truncate">{t.titel}</span>
                      <span className="shrink-0 tabular-nums text-[12px] text-subtle">{datumKurz(t.datum)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
