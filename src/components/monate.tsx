"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { eintraege as zuEintraegen, kalenderwoche } from "@/components/kalender/geometrie";
import { Tagesansicht } from "@/components/tagesansicht";
import type { Termin } from "@/lib/types";
import { datumLang, jetztInBerlin, MONATE } from "@/lib/zeit";

const WT = ["M", "D", "M", "D", "F", "S", "S"];

/** Farbe eines Termins: Alle = rot, Auswahl = hellrot, Jeder Verfügbare = grau */
const FARBE = { alle: "bg-marke-700", auswahl: "bg-marke-300", jeder_verfuegbare: "bg-stone-400" } as const;

function plusMonate(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Wochen eines Monats: je 7 Felder (null = Tag eines anderen Monats) */
function wochen(ym: string): (string | null)[][] {
  const [y, m] = ym.split("-").map(Number);
  const tage = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const erster = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const felder: (string | null)[] = [
    ...Array(erster).fill(null),
    ...Array.from({ length: tage }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (felder.length % 7) felder.push(null);
  return Array.from({ length: felder.length / 7 }, (_, i) => felder.slice(i * 7, i * 7 + 7));
}

const istTag = (x: string | null): x is string => !!x && /^\d{4}-\d{2}-\d{2}$/.test(x);

/**
 * Monat und Tag nach dem Vorbild der Handy-Kalender: Monate untereinander scrollen,
 * Tag antippen öffnet die Tagesansicht („‹ November“ führt zurück). Der Tag steht in der Adresse
 * (?tag=…), damit Zurück-Wischen und Neuladen funktionieren.
 */
export function Monate({ termine, jetzt: jetztStart }: { termine: Termin[]; jetzt: { datum: string; minuten: number } }) {
  const param = useSearchParams().get("tag");
  const tag = istTag(param) ? param : null;
  const [jetzt, setJetzt] = useState(jetztStart);
  const eintraege = useMemo(() => zuEintraegen(termine), [termine]);
  const gepusht = useRef(false);
  // zuletzt geöffneter Tag: dessen Monat zeigt die Liste beim Zurückkehren
  const [zuletzt, setZuletzt] = useState<string | null>(null);
  if (tag && tag !== zuletzt) setZuletzt(tag);

  // Uhrzeit (rote Linie) und „heute“ mitlaufen lassen
  useEffect(() => {
    const id = window.setInterval(() => setJetzt(jetztInBerlin()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const oeffne = (d: string) => {
    gepusht.current = true;
    window.history.pushState(null, "", `?tag=${d}`);
  };
  const wechsle = (d: string) => window.history.replaceState(null, "", `?tag=${d}`);
  const zurueck = () => {
    if (gepusht.current) {
      gepusht.current = false;
      window.history.back();
    } else window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <>
      {tag ? (
        <Tagesansicht tag={tag} eintraege={eintraege} jetzt={jetzt} onTag={wechsle} onZurueck={zurueck} />
      ) : (
        <Monatsliste termine={termine} heute={jetzt.datum} ziel={zuletzt} onTag={oeffne} />
      )}

      {/* „Heute“ schwebt unten links – über der Tab-Leiste */}
      <button
        type="button"
        onClick={() =>
          tag
            ? wechsle(jetzt.datum)
            : document.getElementById(`monat-${jetzt.datum.slice(0, 7)}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-20 rounded-full bg-white px-5 py-2.5 text-[16px] font-semibold text-marke-700 shadow-[0_4px_16px_rgb(31_26_23/0.15)] ring-1 ring-linie active:bg-papier sm:bottom-6"
      >
        Heute
      </button>
    </>
  );
}

/** Alle Monate der Session untereinander; `ziel` = Tag, dessen Monat beim Öffnen gezeigt wird */
function Monatsliste({
  termine,
  heute,
  ziel,
  onTag,
}: {
  termine: Termin[];
  heute: string;
  ziel: string | null;
  onTag: (tag: string) => void;
}) {
  const proTag = useMemo(() => {
    const m = new Map<string, Termin[]>();
    for (const t of termine) m.set(t.datum, [...(m.get(t.datum) ?? []), t]);
    return m;
  }, [termine]);

  // Monate: von der ersten bis zur letzten Session-Woche, heute immer mit dabei
  const monate = useMemo(() => {
    const daten = [...termine.map((t) => t.datum), heute].sort();
    const von = daten[0].slice(0, 7);
    const bis = daten[daten.length - 1].slice(0, 7);
    const l: string[] = [];
    for (let ym = von; ym <= bis; ym = plusMonate(ym, 1)) l.push(ym);
    return l;
  }, [termine, heute]);

  // Beim Öffnen zum aktuellen Monat (bzw. zum Monat des zuletzt geöffneten Tages)
  useEffect(() => {
    const ym = (ziel ?? heute).slice(0, 7);
    if (ym === monate[0]) window.scrollTo({ top: 0 });
    else document.getElementById(`monat-${ym}`)?.scrollIntoView({ block: "start" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Wochentage – bleiben beim Scrollen oben stehen */}
      <div className="sticky top-[calc(59px+env(safe-area-inset-top))] z-10 -mx-4 -mt-5 sm:-mt-6 grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] border-b border-linie bg-papier px-4 py-2">
        <span />
        {WT.map((w, i) => (
          <span key={i} className={`text-center text-[13px] font-semibold ${i >= 5 ? "text-grau" : "text-tinte"}`}>
            {w}
          </span>
        ))}
      </div>

      <div className="space-y-6 pt-4">
        {monate.map((ym) => {
          const [y, m] = ym.split("-").map(Number);
          return (
            <section key={ym} id={`monat-${ym}`} className="scroll-mt-[calc(100px+env(safe-area-inset-top))]">
              <h2 className="flex items-baseline gap-2 px-1 pb-2 pl-8">
                <span className="font-serif text-[30px] font-semibold leading-none text-marke-800">{MONATE[m - 1]}</span>
                <span className="text-[15px] text-grau">{y}</span>
              </h2>
              {wochen(ym).map((woche, wi) => {
                const ersterTag = woche.find(Boolean)!;
                return (
                  <div key={wi} className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] border-t border-linie">
                    <span className="pt-1 text-[11px] tabular-nums text-grau/80">{kalenderwoche(ersterTag)}</span>
                    {woche.map((d, i) => {
                      if (!d) return <span key={i} />;
                      const ts = proTag.get(d) ?? [];
                      const istHeute = d === heute;
                      const vergangen = d < heute;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onTag(d)}
                          aria-label={`${datumLang(d)}, ${ts.length ? `${ts.length} Termine` : "keine Termine"}`}
                          className="flex h-[66px] flex-col items-center gap-1.5 pt-1.5 active:bg-marke-50"
                        >
                          <span
                            className={`grid size-9 place-items-center rounded-full text-[19px] tabular-nums ${
                              istHeute
                                ? "bg-marke-700 font-semibold text-white"
                                : i >= 5 || vergangen
                                  ? "text-grau"
                                  : "text-tinte"
                            }`}
                          >
                            {Number(d.slice(8))}
                          </span>
                          {ts.length ? (
                            <span className={`flex h-[6px] overflow-hidden rounded-full ${vergangen ? "opacity-50" : ""}`}>
                              {ts.slice(0, 5).map((t) => (
                                <span key={t.id} className={`h-full w-[7px] ${FARBE[t.umfang]} ${t.status === "vorbehalt" ? "opacity-60" : ""}`} />
                              ))}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[13px] text-grau">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-marke-700" />
          Alle
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-marke-300" />
          Auswahl
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-stone-400" />
          Jeder Verfügbare
        </li>
      </ul>

    </>
  );
}
