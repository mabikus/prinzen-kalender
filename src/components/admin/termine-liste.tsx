"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CircleHelp, Clock, Copy, Eye, FileDown, Lock, MoreHorizontal, Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Tooltip } from "@/components/ui/controls";
import { DatenTabelle, type Spalte } from "@/components/ui/daten-tabelle";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/page";
import { personenBedarf, werText } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { datumKurz, jetztInBerlin, MONATE, startzeit } from "@/lib/zeit";
import { useTerminAktionen } from "./termin-aktionen";
import { TerminDrawer, type DrawerZiel } from "./termin-drawer";
import { SchnellansichtDrawer } from "./termin-schnellansicht";

export function TermineListe({ termine, gruppen, untertitel }: { termine: Termin[]; gruppen: Gruppe[]; untertitel: string }) {
  const router = useRouter();
  const aktionen = useTerminAktionen();
  const [heute] = useState(() => jetztInBerlin().datum);
  const sp = useSearchParams();
  // Drawer: ?t=<id> bzw. ?neu=1 (auch für Links von außen, z. B. „Bearbeiten“ in der Ansicht)
  const [ziel, setZiel] = useState<DrawerZiel | null>(() => {
    const id = sp.get("t");
    if (id) {
      const t = termine.find((x) => x.id === id);
      return t ? { termin: t } : null;
    }
    if (sp.get("neu") === "1") {
      const d = sp.get("datum");
      return { termin: null, vorlage: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? { datum: d } : undefined };
    }
    return null;
  });
  const adresse = (z: DrawerZiel | null) => {
    const q = z ? (z.termin ? `?t=${encodeURIComponent(z.termin.id)}` : "?neu=1") : "";
    window.history.replaceState(window.history.state, "", `/verwaltung/termine${q}`);
  };
  const zeige = (z: DrawerZiel | null) => {
    setZiel(z);
    adresse(z);
  };
  const oeffnen = (t: Termin) => zeige({ termin: t });
  const [vorschau, setVorschau] = useState<Termin | null>(null);

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
          {t.vertraulich ? (
            <Tooltip content="Vertraulich – nur mit PIN sichtbar">
              <Lock className="size-3.5 shrink-0 text-accent-ink" aria-label="Vertraulich" />
            </Tooltip>
          ) : null}
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
          <>
          <PdfMenue />
          <Button variant="primary" onClick={() => zeige({ termin: null })}>
            <Plus />
            Neuer Termin
          </Button>
          </>
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
          { wert: "vertraulich", titel: "Vertraulich", passt: (t) => t.vertraulich },
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
        aktionenBreite={88}
        aktionen={(t) => (
          <span className="inline-flex items-center gap-0.5">
            <Tooltip content="Schnellansicht">
              <Button variant="ghost" size="icon-sm" aria-label={`Schnellansicht ${t.titel}`} onClick={() => setVorschau(t)}>
                <Eye />
              </Button>
            </Tooltip>
            <TerminMenue t={t} aktionen={aktionen} bearbeiten={() => oeffnen(t)} />
          </span>
        )}
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
      <SchnellansichtDrawer
        t={vorschau ? (termine.find((x) => x.id === vorschau.id) ?? null) : null}
        gruppen={gruppen}
        alle={termine}
        schliessen={() => setVorschau(null)}
        aktionen={{
          bearbeiten: (t) => {
            setVorschau(null);
            oeffnen(t);
          },
          duplizieren: (t) => {
            setVorschau(null);
            void aktionen.duplizieren(t);
          },
          loeschen: (t) => {
            setVorschau(null);
            void aktionen.loeschen(t);
          },
        }}
      />
      <TerminDrawer
        ziel={ziel}
        schliessen={() => zeige(null)}
        gruppen={gruppen}
        alleTermine={termine}
        onGespeichert={() => {
          zeige(null);
          router.refresh();
        }}
        onDuplizieren={(t) => {
          zeige(null);
          void aktionen.duplizieren(t);
        }}
        onLoeschen={(t) => {
          zeige(null);
          void aktionen.loeschen(t);
        }}
      />
    </>
  );
}

/** Terminplan als A4-PDF – mit oder ohne vertrauliche Termine (öffnet in neuem Tab) */
function PdfMenue() {
  const punkt = (href: string, text: string) => (
    <MenuItem asChild>
      <a href={href} target="_blank" rel="noreferrer">
        <FileDown />
        {text}
      </a>
    </MenuItem>
  );
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">
          <FileDown />
          PDF
        </Button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <MenuLabel>Ohne vertrauliche Termine</MenuLabel>
        {punkt("/verwaltung/termine/pdf", "Kommende Termine")}
        {punkt("/verwaltung/termine/pdf?alle=1", "Ganze Session")}
        <MenuSeparator />
        <MenuLabel>Mit vertraulichen Terminen</MenuLabel>
        {punkt("/verwaltung/termine/pdf?vertraulich=1", "Kommende Termine")}
        {punkt("/verwaltung/termine/pdf?alle=1&vertraulich=1", "Ganze Session")}
      </MenuContent>
    </Menu>
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

function TerminMenue({ t, aktionen, bearbeiten }: { t: Termin; aktionen: ReturnType<typeof useTerminAktionen>; bearbeiten: () => void }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aktionen für ${t.titel}`}>
          <MoreHorizontal />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={bearbeiten}>
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
