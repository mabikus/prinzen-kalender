"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleHelp, Clock, Copy, MoreHorizontal, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Tooltip } from "@/components/ui/controls";
import { DatenTabelle, type Spalte } from "@/components/ui/daten-tabelle";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/page";
import { personenBedarf, werText } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { datumKurz, jetztInBerlin, MONATE, startzeit } from "@/lib/zeit";
import { useTerminAktionen } from "./termin-aktionen";

export function TermineListe({ termine, gruppen, untertitel }: { termine: Termin[]; gruppen: Gruppe[]; untertitel: string }) {
  const router = useRouter();
  const aktionen = useTerminAktionen();
  const [heute] = useState(() => jetztInBerlin().datum);
  const oeffnen = (t: Termin) => router.push(`/verwaltung/termine/${encodeURIComponent(t.id)}`);

  const spalten: Spalte<Termin>[] = [
    {
      id: "datum",
      titel: "Datum",
      breite: "116px",
      sortWert: (t) => `${t.datum} ${startzeit(t) ?? "99:99"}`,
      zelle: (t) => <span className="text-muted tabular">{datumKurz(t.datum)}</span>,
    },
    {
      id: "zeit",
      titel: "Zeit",
      breite: "92px",
      sortWert: (t) => startzeit(t) ?? null,
      titelText: (t) => (t.treffzeit && t.beginn && t.treffzeit !== t.beginn ? `Treffen ${t.treffzeit} · Beginn ${t.beginn}` : undefined),
      zelle: (t) =>
        startzeit(t) ? (
          <span className="font-medium tabular">{startzeit(t)}</span>
        ) : (
          <span className="text-subtle/60">–</span>
        ),
    },
    {
      id: "titel",
      titel: "Termin",
      sortWert: (t) => t.titel,
      titelText: (t) => [t.tagesprogramm, t.titel].filter(Boolean).join(": "),
      zelle: (t) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate">
            {t.tagesprogramm ? <span className="text-subtle">{t.tagesprogramm}: </span> : null}
            <span className="font-medium">{t.titel}</span>
          </span>
          {t.pruefen ? (
            <Tooltip content="Noch prüfen">
              <CircleHelp className="size-3.5 shrink-0 text-accent-ink" aria-label="Noch prüfen" />
            </Tooltip>
          ) : null}
          {t.status === "vorbehalt" ? (
            <Tooltip content="Unter Vorbehalt">
              <Clock className="size-3.5 shrink-0 text-subtle" aria-label="Unter Vorbehalt" />
            </Tooltip>
          ) : null}
        </span>
      ),
    },
    {
      id: "ort",
      titel: "Treffpunkt → Ort",
      breite: "22%",
      sortWert: (t) => t.treffpunkt ?? t.ort,
      titelText: (t) => orte(t) || undefined,
      zelle: (t) => (orte(t) ? <span className="text-muted">{orte(t)}</span> : <span className="text-subtle/60">–</span>),
    },
    {
      id: "wer",
      titel: "Wer",
      breite: "15%",
      sortWert: (t) => werText(t, gruppen),
      titelText: (t) => werText(t, gruppen),
      zelle: (t) => <span className="text-muted">{werText(t, gruppen)}</span>,
    },
    {
      id: "karten",
      titel: "Karten",
      breite: "96px",
      rechts: true,
      sortWert: (t) => (t.anmeldung ? personenBedarf(t, gruppen).summe - (t.karten_bestellt ?? 0) : null),
      zelle: (t) => <Karten t={t} gruppen={gruppen} />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={untertitel}
        title="Termine"
        description="Alle Termine der Session – Zeile anklicken zum Bearbeiten."
        actions={
          <Button asChild variant="primary">
            <Link href="/verwaltung/termine/neu">
              <Plus />
              Neuer Termin
            </Link>
          </Button>
        }
      />
      <DatenTabelle
        zeilen={termine}
        schluessel={(t) => t.id}
        spalten={spalten}
        pillen={[
          { wert: "kommend", titel: "Kommend", passt: (t) => t.datum >= heute },
          { wert: "alle", titel: "Alle", passt: () => true },
          { wert: "pruefen", titel: "Prüfen", passt: (t) => !!t.pruefen, hervorheben: true },
          { wert: "karten", titel: "Karten", passt: (t) => !!t.anmeldung },
        ]}
        suchtext={(t) =>
          [t.titel, t.tagesprogramm, t.treffpunkt, t.ort, t.veranstalter, t.bemerkung, datumKurz(t.datum), werText(t, gruppen)]
            .filter(Boolean)
            .join(" ")
        }
        suchPlatzhalter="Titel, Ort, Veranstalter …"
        sortStart={{ id: "datum", richtung: "asc" }}
        gruppe={(t) => {
          const [j, m] = t.datum.split("-").map(Number);
          return `${MONATE[m - 1]} ${j}`;
        }}
        zeilenTon={(t) => (t.datum < heute ? "gedaempft" : undefined)}
        aufZeile={oeffnen}
        aktionen={(t) => <TerminMenue t={t} aktionen={aktionen} />}
        karte={(t) => (
          <span className="flex items-center gap-4">
            <span className="w-[5.5rem] shrink-0 text-[13px] text-subtle tabular">
              {datumKurz(t.datum)}
              <span className="block font-medium text-ink">{startzeit(t) ?? "–"}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[14px] font-medium text-ink">
                {t.status === "vorbehalt" ? <Clock className="size-3.5 shrink-0 text-subtle" aria-label="Vorbehalt" /> : null}
                <span className="truncate">
                  {t.tagesprogramm ? <span className="text-subtle">{t.tagesprogramm}: </span> : null}
                  {t.titel}
                </span>
                {t.pruefen ? <CircleHelp className="size-3.5 shrink-0 text-accent-ink" aria-label="Noch prüfen" /> : null}
              </span>
              <span className="block truncate text-[12.5px] text-subtle">
                {[t.treffpunkt ?? t.ort, werText(t, gruppen)].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="hidden shrink-0 text-[12.5px] sm:inline">
              <Karten t={t} gruppen={gruppen} />
            </span>
          </span>
        )}
        leerTitel="Keine Termine"
        leerText="Mit dieser Auswahl gibt es keine Termine."
      />
    </>
  );
}

function orte(t: Termin) {
  return [t.treffpunkt, t.ort && t.ort !== t.treffpunkt ? t.ort : null].filter(Boolean).join(" → ");
}

/** Karten bestellt/benötigt – rot, solange noch welche fehlen */
function Karten({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  if (!t.anmeldung) return <span className="text-subtle/60">–</span>;
  const b = personenBedarf(t, gruppen);
  return (
    <Tooltip content="bestellt / benötigt">
      <span
        className={cn(
          "inline-flex items-center gap-1 tabular",
          t.karten_bestellt == null || t.karten_bestellt < b.summe ? "text-accent-ink" : "text-muted",
        )}
      >
        <Ticket className="size-3.5" />
        {t.karten_bestellt ?? 0}/{b.summe}
        {b.ohneAngabe.length ? "+" : ""}
      </span>
    </Tooltip>
  );
}

function TerminMenue({ t, aktionen }: { t: Termin; aktionen: ReturnType<typeof useTerminAktionen> }) {
  const router = useRouter();
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aktionen für ${t.titel}`}>
          <MoreHorizontal />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={() => router.push(`/verwaltung/termine/${encodeURIComponent(t.id)}`)}>
          <Pencil />
          Bearbeiten
        </MenuItem>
        <MenuItem onSelect={() => void aktionen.duplizieren(t)}>
          <Copy />
          Duplizieren
        </MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={() => void aktionen.loeschen(t)}>
          <Trash2 />
          Löschen
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
