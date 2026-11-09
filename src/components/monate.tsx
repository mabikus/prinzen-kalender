"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { hhmm, kalenderwoche } from "@/components/kalender/geometrie";
import { werText } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { datumLang, jetztInBerlin, MONATE, zeitplan } from "@/lib/zeit";

const WT = ["M", "D", "M", "D", "F", "S", "S"];

/** Farbe eines Termins: Alle = rot, Auswahl = hellrot, Jeder Verfügbare = grau */
const FARBE = { alle: "bg-marke-700", auswahl: "bg-marke-300", jeder_verfuegbare: "bg-stone-400" } as const;

const istTag = (x: string | null): x is string => !!x && /^\d{4}-\d{2}-\d{2}$/.test(x);

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

/**
 * Monatskalender nach dem Vorbild der Handy-Kalender: farbige Striche zeigen, wo etwas ist,
 * Tag antippen listet seine Termine darunter. Wischen oder Pfeile blättern die Monate.
 * Der gewählte Tag steht in der Adresse (?tag=…), damit Neuladen und Zurück funktionieren.
 */
export function Monate({
  termine,
  gruppen,
  jetzt: jetztStart,
}: {
  termine: Termin[];
  gruppen: Gruppe[];
  jetzt: { datum: string; minuten: number };
}) {
  const [jetzt, setJetzt] = useState(jetztStart);
  const heute = jetzt.datum;
  const param = useSearchParams().get("tag");
  const tag = istTag(param) ? param : heute;
  const monat = tag.slice(0, 7);

  const plan = useMemo(() => zeitplan(termine), [termine]);
  const proTag = useMemo(() => {
    const m = new Map<string, Termin[]>();
    for (const t of termine) m.set(t.datum, [...(m.get(t.datum) ?? []), t]);
    for (const l of m.values()) l.sort((a, b) => (plan.get(a.id)?.start ?? -1) - (plan.get(b.id)?.start ?? -1));
    return m;
  }, [termine, plan]);

  // Blättern nur innerhalb der Session (erster bis letzter Termin, heute immer mit dabei)
  const [vonMonat, bisMonat] = useMemo(() => {
    const daten = [...termine.map((t) => t.datum), heute].sort();
    return [daten[0].slice(0, 7), daten[daten.length - 1].slice(0, 7)];
  }, [termine, heute]);

  // „heute“ mitlaufen lassen (App bleibt über Mitternacht offen)
  useEffect(() => {
    const id = window.setInterval(() => setJetzt(jetztInBerlin()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const waehle = (d: string) => window.history.replaceState(null, "", d === heute ? window.location.pathname : `?tag=${d}`);

  /** Anderer Monat: heute, sonst der erste Tag mit Terminen, sonst der Erste */
  const blaettern = (richtung: 1 | -1) => {
    const ym = plusMonate(monat, richtung);
    if (ym < vonMonat || ym > bisMonat) return;
    if (heute.startsWith(ym)) return waehle(heute);
    const erster = [...proTag.keys()].filter((d) => d.startsWith(ym)).sort()[0];
    waehle(erster ?? `${ym}-01`);
  };

  const wisch = useRef<{ x: number; y: number } | null>(null);
  const [y, m] = monat.split("-").map(Number);
  const amTag = proTag.get(tag) ?? [];

  return (
    <>
      <div
        className="touch-pan-y select-none"
        onTouchStart={(e) => {
          const p = e.touches[0];
          wisch.current = { x: p.clientX, y: p.clientY };
        }}
        onTouchEnd={(e) => {
          const s = wisch.current;
          wisch.current = null;
          if (!s) return;
          const p = e.changedTouches[0];
          const dx = p.clientX - s.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(p.clientY - s.y) * 1.5) blaettern(dx < 0 ? 1 : -1);
        }}
      >
        <div className="flex items-center justify-between gap-2 pb-3">
          <h1 className="flex items-baseline gap-2">
            <span className="font-serif text-[30px] font-semibold leading-none text-marke-800">{MONATE[m - 1]}</span>
            <span className="text-[16px] text-grau">{y}</span>
          </h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => waehle(heute)}
              disabled={tag === heute}
              className="mr-1 rounded-full border border-linie bg-panel px-3.5 py-1.5 text-[15px] font-semibold text-marke-700 active:bg-marke-50 disabled:border-transparent disabled:bg-transparent disabled:text-stone-300"
            >
              Heute
            </button>
            <button
              type="button"
              onClick={() => blaettern(-1)}
              disabled={monat <= vonMonat}
              aria-label="Voriger Monat"
              className="grid size-10 place-items-center rounded-full text-marke-700 active:bg-marke-50 disabled:text-stone-300"
            >
              <ChevronLeft className="size-6" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => blaettern(1)}
              disabled={monat >= bisMonat}
              aria-label="Nächster Monat"
              className="grid size-10 place-items-center rounded-full text-marke-700 active:bg-marke-50 disabled:text-stone-300"
            >
              <ChevronRight className="size-6" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] border-b border-linie pb-1.5">
          <span />
          {WT.map((w, i) => (
            <span key={i} className={cn("text-center text-[13px] font-semibold", i >= 5 ? "text-grau" : "text-tinte")}>
              {w}
            </span>
          ))}
        </div>

        {wochen(monat).map((woche, wi) => {
          const ersterTag = woche.find(Boolean)!;
          const aktuelleWoche = woche.includes(heute);
          return (
            <div key={wi} className={cn("grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))]", wi > 0 && "border-t border-linie")}>
              <span className={cn("pt-1 text-[11px] tabular-nums", aktuelleWoche ? "font-semibold text-marke-700" : "text-grau/80")}>
                {kalenderwoche(ersterTag)}
              </span>
              {woche.map((d, i) => {
                if (!d) return <span key={i} />;
                const ts = proTag.get(d) ?? [];
                const istHeute = d === heute;
                const gewaehlt = d === tag;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => waehle(d)}
                    aria-label={`${datumLang(d)}, ${ts.length ? `${ts.length} ${ts.length === 1 ? "Termin" : "Termine"}` : "keine Termine"}`}
                    aria-pressed={gewaehlt}
                    className="flex h-[52px] flex-col items-center gap-[3px] pt-[3px]"
                  >
                    <span
                      className={cn(
                        "grid size-[34px] place-items-center rounded-full text-[19px] tabular-nums transition-colors",
                        istHeute && "bg-marke-700 font-semibold text-white",
                        !istHeute && gewaehlt && "bg-tinte font-semibold text-papier",
                        !istHeute && !gewaehlt && (i >= 5 ? "text-grau" : "text-tinte"),
                      )}
                    >
                      {Number(d.slice(8))}
                    </span>
                    {ts.length ? (
                      <span className={cn("flex h-[6px] overflow-hidden rounded-full", d < heute && "opacity-50")}>
                        {ts.slice(0, 5).map((t) => (
                          <span key={t.id} className={cn("h-full w-[7px]", FARBE[t.umfang], t.status === "vorbehalt" && "opacity-60")} />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Termine des gewählten Tages */}
      <section aria-live="polite" className="mt-2 border-t border-linie pt-4">
        <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-wide text-grau">
          {datumLang(tag).replace(/ \d{4}$/, "")}
          {tag === heute ? " · heute" : ""}
        </h2>
        {amTag.length ? (
          <ul className="divide-y divide-linie overflow-hidden rounded-[14px] border border-linie bg-panel">
            {amTag.map((t) => {
              const z = plan.get(t.id);
              const ort = t.treffzeit ? (t.treffpunkt ?? t.ort) : (t.ort ?? t.treffpunkt);
              return (
                <li key={t.id}>
                  <Link href={`/termin/${t.id}`} className="flex items-stretch gap-3 px-3 py-3 active:bg-papier">
                    <span className={cn("w-1 shrink-0 rounded-full", FARBE[t.umfang], t.status === "vorbehalt" && "opacity-60")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-semibold leading-snug text-tinte">{t.titel}</span>
                      {ort ? (
                        <span className="mt-0.5 flex items-center gap-1 text-[14px] text-grau">
                          <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                          <span className="truncate">{ort}</span>
                        </span>
                      ) : null}
                      <span className="mt-0.5 block truncate text-[13px] text-grau">
                        {werText(t, gruppen)}
                        {t.status === "vorbehalt" ? " · unter Vorbehalt" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[14px] leading-snug tabular-nums">
                      {z && !z.ganztags && z.start != null ? (
                        <>
                          <span className="block font-semibold text-tinte">{hhmm(z.start)}</span>
                          {t.treffzeit && t.beginn && t.treffzeit !== t.beginn ? (
                            <span className="block text-grau">Beginn {t.beginn}</span>
                          ) : z.ende != null ? (
                            <span className="block text-grau">
                              {t.ende ? "" : "ca. "}
                              {hhmm(z.ende % 1440)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-grau">
                          <Clock className="size-3.5" strokeWidth={1.75} aria-hidden />
                          offen
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-1 py-4 text-[16px] text-grau">Keine Termine</p>
        )}
      </section>

    </>
  );
}
