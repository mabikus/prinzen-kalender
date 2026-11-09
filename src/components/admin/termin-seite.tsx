"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Eye, History, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { PageHeader, Section } from "@/components/ui/page";
import type { ProtokollEintrag } from "@/lib/daten";
import { AKTION, aenderungen, zeitpunkt } from "@/lib/protokoll-text";
import type { Gruppe, Termin } from "@/lib/types";
import { datumLang } from "@/lib/zeit";
import { TerminFormular, type Vorlage } from "./termin-formular";
import { useTerminAktionen } from "./termin-aktionen";

export function TerminSeite({
  termin,
  vorlage,
  gruppen,
  alleTermine,
  verlauf,
}: {
  termin: Termin | null;
  vorlage: Vorlage;
  gruppen: Gruppe[];
  alleTermine: Termin[];
  verlauf: ProtokollEintrag[];
}) {
  const router = useRouter();
  const aktionen = useTerminAktionen(() => router.push("/verwaltung/termine"));

  return (
    <>
      <Link href="/verwaltung/termine" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-subtle hover:text-ink">
        <ArrowLeft className="size-4" />
        Termine
      </Link>
      <PageHeader
        eyebrow={termin ? datumLang(termin.datum) : "Neu"}
        title={termin ? termin.titel : "Neuer Termin"}
        actions={
          termin ? (
            <Menu>
              <MenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Weitere Aktionen">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem asChild>
                  <Link href={`/termin/${encodeURIComponent(termin.id)}`}>
                    <Eye />
                    In der Ansicht öffnen
                  </Link>
                </MenuItem>
                <MenuItem
                  onSelect={async () => {
                    const k = await aktionen.duplizieren(termin);
                    if (k) router.push(`/verwaltung/termine/${encodeURIComponent(k.id)}`);
                  }}
                >
                  <Copy />
                  Duplizieren
                </MenuItem>
                <MenuSeparator />
                <MenuItem destructive onSelect={() => void aktionen.loeschen(termin)}>
                  <Trash2 />
                  Löschen
                </MenuItem>
              </MenuContent>
            </Menu>
          ) : null
        }
      />
      <TerminFormular
        termin={termin}
        vorlage={vorlage}
        gruppen={gruppen}
        alleTermine={alleTermine}
        onAbbrechen={() => router.back()}
        onGespeichert={(t) => {
          if (termin) router.refresh();
          else router.replace(`/verwaltung/termine/${encodeURIComponent(t.id)}`);
        }}
      />
      {verlauf.length ? (
        <Section title="Verlauf" className="mt-6">
          <ul className="divide-y divide-line">
            {verlauf.map((p) => (
              <li key={p.id} className="flex gap-3 py-2.5 text-[13px]">
                <History className="mt-0.5 size-4 shrink-0 text-subtle" />
                <div className="min-w-0">
                  <div>
                    <strong className="font-medium">{p.benutzer_name ?? "Unbekannt"}</strong>{" "}
                    {AKTION[p.aktion] ?? p.aktion}
                    <span className="ml-2 text-subtle">{zeitpunkt(p.zeitpunkt)}</span>
                  </div>
                  {aenderungen(p.details).map((z) => (
                    <div key={z} className="truncate text-subtle">
                      {z}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
