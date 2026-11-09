"use client";

import { Dialog as D } from "radix-ui";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { TerminZeile } from "@/components/termin";
import type { Gruppe, Termin } from "@/lib/types";
import { datumLang, MONATE, zeitplan } from "@/lib/zeit";

const WT = ["M", "D", "M", "D", "F", "S", "S"];

/** Farbe eines Termins: Alle = rot, Auswahl = hellrot, Jeder Verfügbare = grau */
const FARBE = { alle: "bg-marke-700", auswahl: "bg-marke-300", jeder_verfuegbare: "bg-stone-400" } as const;

function plusMonate(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** ISO-Kalenderwoche */
function kw(datum: string) {
  const d = new Date(`${datum}T12:00:00Z`);
  const tag = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tag + 3);
  const ersterDo = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - ersterDo.getTime()) / 86_400_000 - 3 + ((ersterDo.getUTCDay() + 6) % 7)) / 7);
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

/**
 * Monatsansicht nach dem Vorbild der Handy-Kalender: alle Monate der Session untereinander,
 * große Tageszahlen, farbige Striche für Termine, Tag antippen → Blatt mit den Terminen.
 */
export function Monate({ termine, gruppen, heute }: { termine: Termin[]; gruppen: Gruppe[]; heute: string }) {
  const [tag, setTag] = useState<string | null>(null);
  const plan = useMemo(() => zeitplan(termine), [termine]);
  const nachId = useMemo(() => new Map(termine.map((t) => [t.id, t])), [termine]);

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

  const zielMonat = monate.includes(heute.slice(0, 7)) ? heute.slice(0, 7) : monate[0];
  const springen = (ym: string, sanft = true) =>
    document.getElementById(`monat-${ym}`)?.scrollIntoView({ behavior: sanft ? "smooth" : "auto", block: "start" });

  // Beim Öffnen zum aktuellen Monat
  useEffect(() => {
    if (zielMonat !== monate[0]) springen(zielMonat, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const amTag = tag ? (proTag.get(tag) ?? []) : [];

  return (
    <>
      {/* Wochentage – bleiben beim Scrollen oben stehen */}
      <div className="sticky top-[calc(59px+env(safe-area-inset-top))] z-10 -mx-4 -mt-5 sm:-mt-6 grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] border-b border-linie bg-papier/95 px-4 py-2 backdrop-blur">
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
                    <span className="pt-1 text-[11px] tabular-nums text-grau/80">{kw(ersterTag)}</span>
                    {woche.map((d, i) => {
                      if (!d) return <span key={i} />;
                      const ts = proTag.get(d) ?? [];
                      const istHeute = d === heute;
                      const vergangen = d < heute;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTag(d)}
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
                            } ${tag === d && !istHeute ? "ring-2 ring-marke-300" : ""}`}
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

      {/* „Heute“ schwebt unten links – über der Tab-Leiste */}
      <button
        type="button"
        onClick={() => springen(heute.slice(0, 7))}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 z-20 rounded-full bg-white px-5 py-2.5 text-[16px] font-semibold text-marke-700 shadow-[0_4px_16px_rgb(31_26_23/0.15)] ring-1 ring-linie active:bg-papier sm:bottom-6"
      >
        Heute
      </button>

      {/* Termine des Tages als Blatt von unten */}
      <D.Root open={!!tag} onOpenChange={(o) => !o && setTag(null)}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-40 bg-black/35 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <D.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80dvh] max-w-xl flex-col rounded-t-[18px] bg-papier shadow-[0_-8px_32px_rgb(31_26_23/0.2)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=open]:duration-300">
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300" aria-hidden />
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
              <div>
                <D.Title className="font-serif text-[22px] font-semibold text-marke-800">{tag ? datumLang(tag).replace(/ \d{4}$/, "") : ""}</D.Title>
                <D.Description className="text-[14px] text-grau">
                  {amTag.length ? `${amTag.length} ${amTag.length === 1 ? "Termin" : "Termine"}` : "Keine Termine"}
                  {tag === heute ? " · heute" : ""}
                </D.Description>
              </div>
              <D.Close className="grid size-9 place-items-center rounded-full bg-stone-200/70 text-grau" aria-label="Schließen">
                <X className="size-[18px]" />
              </D.Close>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {amTag.length ? (
                amTag.map((t) => (
                  <TerminZeile
                    key={t.id}
                    t={t}
                    z={plan.get(t.id)}
                    gruppen={gruppen}
                    vorher={t.anschluss_an ? nachId.get(t.anschluss_an) : undefined}
                  />
                ))
              ) : (
                <p className="rounded-[14px] border border-linie bg-white px-4 py-6 text-center text-[16px] text-grau">
                  An diesem Tag ist nichts geplant.
                </p>
              )}
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
