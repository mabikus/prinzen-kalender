"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, Clock, MapPin } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { hhmm, kalenderwoche, plusTage, RASTER_BIS, RASTER_VON, verteile, wochenStart, type Eintrag } from "@/components/kalender/geometrie";
import type { Termin } from "@/lib/types";
import { datumLang, MONATE } from "@/lib/zeit";

const WT = ["M", "D", "M", "D", "F", "S", "S"];
/** Höhe einer Stunde – etwas größer als am PC, damit Termine mit dem Finger gut zu treffen sind */
const STUNDE = 56;
const PX = STUNDE / 60;
const STUNDEN = Array.from({ length: (RASTER_BIS - RASTER_VON) / 60 + 1 }, (_, i) => RASTER_VON / 60 + i);

/** Blockfarbe: Alle = kräftig rot, Auswahl = hellrot, Jeder Verfügbare = grau */
function blockStil(t: Termin) {
  return cn(
    t.umfang === "alle" && "border-marke-700 bg-marke-100 text-marke-900",
    t.umfang === "auswahl" && "border-marke-300 bg-marke-50 text-marke-900",
    t.umfang === "jeder_verfuegbare" && "border-stone-400 bg-stone-200/70 text-tinte",
    t.status === "vorbehalt" &&
      "[background-image:repeating-linear-gradient(135deg,transparent_0,transparent_7px,rgb(255_255_255/0.6)_7px,rgb(255_255_255/0.6)_14px)]",
  );
}

/** Wischen nach links/rechts (nicht beim senkrechten Scrollen) */
function useWischen(weiter: (richtung: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => {
      const p = e.touches[0];
      start.current = { x: p.clientX, y: p.clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - s.x;
      const dy = p.clientY - s.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) weiter(dx < 0 ? 1 : -1);
    },
  };
}

/**
 * Tagesansicht nach dem Vorbild der Handy-Kalender: Wochenleiste oben, Zeitraster mit Terminblöcken,
 * rote Linie für „jetzt“. Wischen auf der Leiste blättert Wochen, auf dem Raster Tage.
 */
export function Tagesansicht({
  tag,
  eintraege,
  jetzt,
  onTag,
  onZurueck,
}: {
  tag: string;
  eintraege: Eintrag[];
  jetzt: { datum: string; minuten: number };
  onTag: (tag: string) => void;
  onZurueck: () => void;
}) {
  const raster = useRef<HTMLDivElement>(null);
  const kopf = useRef<HTMLDivElement>(null);
  const woche = useMemo(() => Array.from({ length: 7 }, (_, i) => plusTage(wochenStart(tag), i)), [tag]);
  const mitTerminen = useMemo(() => new Set(eintraege.map((e) => e.tag)), [eintraege]);
  const amTag = useMemo(() => eintraege.filter((e) => e.tag === tag), [eintraege, tag]);
  const ganztags = amTag.filter((e) => e.ganztags);
  const plaetze = useMemo(() => verteile(amTag.filter((e) => !e.ganztags)), [amTag]);
  const istHeute = tag === jetzt.datum;

  const wocheWischen = useWischen((r) => onTag(plusTage(tag, r * 7)));
  const tagWischen = useWischen((r) => onTag(plusTage(tag, r)));

  // Beim Tageswechsel zum ersten Termin (heute: zur aktuellen Uhrzeit) scrollen
  useEffect(() => {
    const starts = plaetze.map((p) => p.eintrag.start);
    if (istHeute) starts.push(jetzt.minuten);
    const ziel = Math.max(RASTER_VON, (starts.length ? Math.min(...starts) : 10 * 60) - 60);
    const el = raster.current;
    if (!el) return;
    const unterKopf = kopf.current?.getBoundingClientRect().bottom ?? 0;
    const y = el.getBoundingClientRect().top + window.scrollY + (ziel - RASTER_VON) * PX - unterKopf - 20;
    window.scrollTo({ top: Math.max(0, y) });
  }, [tag]); // eslint-disable-line react-hooks/exhaustive-deps

  const monat = MONATE[Number(tag.slice(5, 7)) - 1];

  return (
    <>
      <div
        ref={kopf}
        className="sticky top-[calc(59px+env(safe-area-inset-top))] z-10 -mx-4 -mt-5 border-b border-linie bg-papier sm:-mt-6"
      >
        <div className="flex h-11 items-center px-2">
          <button
            type="button"
            onClick={onZurueck}
            className="flex items-center gap-0.5 rounded-full py-1.5 pl-1 pr-3 text-[17px] font-semibold text-marke-700 active:bg-marke-50"
          >
            <ChevronLeft className="size-6" strokeWidth={2} aria-hidden />
            {monat}
          </button>
        </div>

        <div className="grid touch-pan-y grid-cols-7 px-2 pb-2" {...wocheWischen}>
          {woche.map((d, i) => {
            const gewaehlt = d === tag;
            const heute = d === jetzt.datum;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onTag(d)}
                aria-label={datumLang(d)}
                aria-current={gewaehlt ? "date" : undefined}
                className="flex flex-col items-center gap-1"
              >
                <span className={cn("text-[12px] font-semibold", i >= 5 ? "text-grau" : "text-tinte")}>{WT[i]}</span>
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full text-[20px] tabular-nums transition-colors",
                    gewaehlt && heute && "bg-marke-700 font-semibold text-white",
                    gewaehlt && !heute && "bg-tinte font-semibold text-white",
                    !gewaehlt && heute && "font-semibold text-marke-700",
                    !gewaehlt && !heute && (i >= 5 ? "text-grau" : "text-tinte"),
                  )}
                >
                  {Number(d.slice(8))}
                </span>
                <span className={cn("size-1.5 rounded-full", mitTerminen.has(d) && !gewaehlt ? "bg-stone-400" : "bg-transparent")} />
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline gap-3 border-t border-linie px-4 py-2">
          <span className="w-12 shrink-0 text-[14px] text-grau">KW {kalenderwoche(tag)}</span>
          <span className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold text-tinte">{datumLang(tag)}</span>
          <span className="w-12 shrink-0" />
        </div>

        {ganztags.length ? (
          <div className="space-y-1 border-t border-linie px-4 py-2">
            {ganztags.map((e) => (
              <Link
                key={e.t.id}
                href={`/termin/${e.t.id}`}
                className={cn("block truncate rounded-[6px] border-l-[3px] px-2 py-1 text-[14px] font-semibold", blockStil(e.t))}
              >
                {e.t.titel} <span className="font-normal opacity-70">· ganztägig</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div ref={raster} className="relative mt-3 touch-pan-y" style={{ height: (RASTER_BIS - RASTER_VON) * PX + 12 }} {...tagWischen}>
        {STUNDEN.map((h) => (
          <div key={h} className="absolute inset-x-0 flex items-center" style={{ top: (h * 60 - RASTER_VON) * PX - 8 }}>
            <span
              className={cn(
                "w-12 shrink-0 pr-2 text-right text-[12px] tabular-nums text-grau",
                istHeute && Math.abs(jetzt.minuten - h * 60) < 15 && "invisible",
              )}
            >{`${String(h % 24).padStart(2, "0")}:00`}</span>
            <span className="h-px flex-1 bg-linie" />
          </div>
        ))}

        <div className="absolute inset-y-0 left-12 right-0">
          {plaetze.map(({ eintrag: e, spalte, spalten }) => {
            const hoehe = Math.max((e.ende - e.start) * PX, 26);
            const t = e.t;
            const ort = t.treffzeit ? (t.treffpunkt ?? t.ort) : (t.ort ?? t.treffpunkt);
            const zeit =
              t.treffzeit && t.beginn && t.treffzeit !== t.beginn
                ? `Treffen ${t.treffzeit} · Beginn ${t.beginn}`
                : `${hhmm(e.start)} – ${hhmm(e.ende % 1440)}`;
            return (
              <Link
                key={t.id}
                href={`/termin/${t.id}`}
                className={cn(
                  "absolute overflow-hidden rounded-[6px] border-l-[3px] px-2 py-1 shadow-[0_0_0_1px_var(--bg)] active:brightness-95",
                  blockStil(t),
                )}
                style={{
                  top: (e.start - RASTER_VON) * PX,
                  height: hoehe,
                  left: `calc(${(spalte / spalten) * 100}% + 2px)`,
                  width: `calc(${100 / spalten}% - 4px)`,
                }}
              >
                <p className="truncate text-[15px] font-semibold leading-snug">{t.titel}</p>
                {hoehe >= 48 && ort ? (
                  <p className="flex items-center gap-1 truncate text-[13px] leading-snug opacity-80">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="truncate">{ort}</span>
                  </p>
                ) : null}
                {hoehe >= 66 ? (
                  <p className="flex items-center gap-1 truncate text-[13px] leading-snug opacity-80">
                    <Clock className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span className="truncate tabular-nums">{zeit}</span>
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>

        {istHeute && jetzt.minuten >= RASTER_VON ? (
          <div className="pointer-events-none absolute inset-x-0 z-[1] flex items-center" style={{ top: (jetzt.minuten - RASTER_VON) * PX - 10 }}>
            <span className="w-12 shrink-0 pr-1 text-right">
              <span className="rounded-full bg-marke-700 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                {hhmm(jetzt.minuten)}
              </span>
            </span>
            <span className="h-[2px] flex-1 bg-marke-700" />
          </div>
        ) : null}
      </div>
    </>
  );
}
