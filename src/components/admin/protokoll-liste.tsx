"use client";

import { DatenTabelle } from "@/components/ui/daten-tabelle";
import type { ProtokollEintrag } from "@/lib/daten";
import { AKTION, aenderungen, zeitpunkt } from "@/lib/protokoll-text";

/** Protokoll als KBN-Liste – Bereiche als Pills, jede Spalte sortierbar */
export function ProtokollListe({ eintraege }: { eintraege: ProtokollEintrag[] }) {
  const bereich = (p: ProtokollEintrag) => p.aktion.split(".")[0];
  return (
    <DatenTabelle
      zeilen={eintraege}
      schluessel={(p) => String(p.id)}
      spalten={[
        {
          id: "zeitpunkt",
          titel: "Zeitpunkt",
          breite: "170px",
          sortWert: (p) => p.zeitpunkt,
          zelle: (p) => <span className="text-subtle tabular">{zeitpunkt(p.zeitpunkt)}</span>,
        },
        {
          id: "wer",
          titel: "Wer",
          breite: "16%",
          sortWert: (p) => p.benutzer_name,
          zelle: (p) => <span className="font-medium">{p.benutzer_name ?? "Unbekannt"}</span>,
        },
        {
          id: "aktion",
          titel: "Aktion",
          breite: "22%",
          sortWert: (p) => AKTION[p.aktion] ?? p.aktion,
          titelText: (p) => AKTION[p.aktion] ?? p.aktion,
          zelle: (p) => <span className="text-muted">{AKTION[p.aktion] ?? p.aktion}</span>,
        },
        {
          id: "titel",
          titel: "Betrifft",
          breite: "20%",
          sortWert: (p) => p.titel,
          titelText: (p) => p.titel ?? undefined,
          zelle: (p) => (p.titel ? <span className="text-accent-ink">{p.titel}</span> : <span className="text-subtle/60">–</span>),
        },
        {
          id: "aenderungen",
          titel: "Änderungen",
          titelText: (p) => aenderungen(p.details).join("\n") || undefined,
          zelle: (p) => {
            const z = aenderungen(p.details);
            return z.length ? <span className="text-[13px] text-subtle">{z.join(" · ")}</span> : <span className="text-subtle/60">–</span>;
          },
        },
      ]}
      pillen={[
        { wert: "alle", titel: "Alle", passt: () => true },
        { wert: "termin", titel: "Termine", passt: (p) => bereich(p) === "termin" },
        { wert: "gruppe", titel: "Gruppen", passt: (p) => bereich(p) === "gruppe" },
        { wert: "benutzer", titel: "Benutzer", passt: (p) => bereich(p) === "benutzer" },
        { wert: "darstellung", titel: "Darstellung", passt: (p) => bereich(p) === "darstellung" },
      ]}
      suchtext={(p) => [p.benutzer_name, AKTION[p.aktion], p.titel, ...aenderungen(p.details)].filter(Boolean).join(" ")}
      suchPlatzhalter="Wer, was, Termin …"
      sortStart={{ id: "zeitpunkt", richtung: "desc" }}
      karte={(p) => (
        <span className="block text-[13.5px]">
          <span className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span>
              <strong className="font-medium">{p.benutzer_name ?? "Unbekannt"}</strong> {AKTION[p.aktion] ?? p.aktion}{" "}
              {p.titel ? <span className="text-accent-ink">„{p.titel}“</span> : null}
            </span>
            <span className="text-[12.5px] text-subtle tabular">{zeitpunkt(p.zeitpunkt)}</span>
          </span>
          {aenderungen(p.details).map((z) => (
            <span key={z} className="mt-0.5 block truncate text-[12.5px] text-subtle">
              {z}
            </span>
          ))}
        </span>
      )}
      leerTitel="Noch keine Änderungen"
    />
  );
}
