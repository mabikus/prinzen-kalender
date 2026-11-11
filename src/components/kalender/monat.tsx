"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Ticket } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { Termin } from "@/lib/types";
import { hhmm, type Eintrag } from "./geometrie";
import { FlaecheMenue, TerminMenue } from "./menue";
import { kachelStil } from "./zeitraster";

const WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const SICHTBAR = 4;

/** Monatsansicht: Termine als Zeilen je Tag, ziehen auf einen anderen Tag verschiebt das Datum. */
export function Monatsansicht({
  tage,
  monat,
  eintraege,
  heute,
  ausgewaehlt,
  onAuswahl,
  onDoppelklick,
  onVerschieben,
  onAnlegen,
  onTag,
  kompakt,
}: {
  /** Handy: statt Text nur farbige Striche, Tippen öffnet den Tag */
  kompakt?: boolean;
  tage: string[];
  monat: string; // YYYY-MM
  eintraege: Eintrag[];
  heute: string;
  ausgewaehlt: string | null;
  onAuswahl: (id: string | null, tag?: string) => void;
  onDoppelklick: (t: Termin) => void;
  onVerschieben: (e: Eintrag, minuten: number, tage: number) => void;
  onAnlegen: (tag: string) => void;
  onTag: (tag: string) => void;
}) {
  const zug = useRef<{ e: Eintrag; x0: number; y0: number; aktiv: boolean; touch: boolean } | null>(null);
  const zielRef = useRef<string | null>(null);
  const [ziel, setZielState] = useState<string | null>(null);
  const [gezogen, setGezogen] = useState<string | null>(null);

  useEffect(() => {
    const bewegen = (ev: PointerEvent) => {
      const z = zug.current;
      if (!z) return;
      if (!z.aktiv) {
        if (Math.hypot(ev.clientX - z.x0, ev.clientY - z.y0) < (z.touch ? 10 : 4)) return;
        if (z.touch) {
          zug.current = null;
          return;
        }
        z.aktiv = true;
        setGezogen(z.e.t.id);
        document.body.style.userSelect = "none";
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-monatstag]");
      const tag = el?.dataset.monatstag ?? null;
      if (tag !== zielRef.current) {
        zielRef.current = tag;
        setZielState(tag);
      }
    };
    const loslassen = () => {
      const z = zug.current;
      zug.current = null;
      document.body.style.userSelect = "";
      const tag = zielRef.current;
      zielRef.current = null;
      setZielState(null);
      setGezogen(null);
      if (!z) return;
      if (!z.aktiv) return onAuswahl(z.e.t.id);
      if (tag && tag !== z.e.tag) {
        const diff = Math.round((Date.parse(`${tag}T12:00:00Z`) - Date.parse(`${z.e.tag}T12:00:00Z`)) / 86_400_000);
        onVerschieben(z.e, 0, diff);
      }
    };
    window.addEventListener("pointermove", bewegen);
    window.addEventListener("pointerup", loslassen);
    // Browser übernimmt (z. B. Scrollen mit dem Finger): Zug verwerfen
    const abbrechen = () => {
      zug.current = null;
    };
    window.addEventListener("pointercancel", abbrechen);
    return () => {
      window.removeEventListener("pointercancel", abbrechen);
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerup", loslassen);
    };
  }, [onAuswahl, onVerschieben]);

  const wochen = tage.length / 7;
  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <div className="grid shrink-0 grid-cols-7 border-b border-line">
        {WT.map((w, i) => (
          <div
            key={w}
            className={cn(
              "border-l border-line py-2 text-center text-[11px] font-semibold uppercase tracking-wider first:border-l-0",
              i >= 5 ? "text-accent-ink" : "text-subtle",
            )}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${wochen}, minmax(${kompakt ? "64px" : "110px"}, 1fr))` }}>
        {tage.map((tag, i) => {
          const liste = eintraege.filter((e) => e.tag === tag).sort((a, b) => Number(!a.ganztags) - Number(!b.ganztags) || a.start - b.start);
          const fremd = !tag.startsWith(monat);
          const ist = tag === heute;
          return (
            <FlaecheMenue key={tag} tag={tag} start={18 * 60}>
              <div
                data-monatstag={tag}
                onDoubleClick={(ev) => ev.target === ev.currentTarget && onAnlegen(tag)}
                onClick={(ev) => ev.target === ev.currentTarget && onAuswahl(null, tag)}
                className={cn(
                  "min-w-0 overflow-hidden border-b border-l border-line p-1",
                  i % 7 === 0 && "border-l-0",
                  fremd && "bg-bg",
                  ziel === tag && "bg-accent-soft ring-2 ring-inset ring-accent",
                )}
              >
                <div className="mb-0.5 flex justify-between px-0.5">
                  <button
                    type="button"
                    onClick={() => onTag(tag)}
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[12px] tabular-nums hover:bg-hover",
                      ist ? "bg-accent font-semibold text-accent-fg hover:bg-accent-hover" : fremd ? "text-subtle" : "text-ink",
                    )}
                  >
                    {Number(tag.slice(8))}
                  </button>
                </div>
                {kompakt ? (
                  <button type="button" onClick={() => onTag(tag)} className="flex w-full flex-col gap-[3px] px-0.5 pt-0.5" aria-label={`${liste.length} Termine`}>
                    {liste.slice(0, 5).map((e) => (
                      <span
                        key={e.t.id}
                        className={cn(
                          "h-[5px] w-full rounded-full",
                          e.t.umfang === "alle" ? "bg-accent" : "bg-accent/45",
                          e.t.status === "vorbehalt" && "opacity-60",
                        )}
                      />
                    ))}
                    {liste.length > 5 ? <span className="text-center text-[10px] leading-none text-subtle">+{liste.length - 5}</span> : null}
                  </button>
                ) : (
                <div className="space-y-0.5">
                  {liste.slice(0, SICHTBAR).map((e) => (
                    <TerminMenue key={e.t.id} termin={e.t}>
                      <div
                        role="button"
                        tabIndex={-1}
                        onPointerDown={(ev) => {
                          if (ev.button !== 0) return;
                          zug.current = { e, x0: ev.clientX, y0: ev.clientY, aktiv: false, touch: ev.pointerType === "touch" };
                        }}
                        onDoubleClick={() => onDoppelklick(e.t)}
                        className={cn(
                          "flex cursor-grab items-center gap-1 truncate rounded-[4px] px-1.5 py-[3px] text-[11.5px] font-medium leading-tight",
                          kachelStil(e.t),
                          ausgewaehlt === e.t.id && "ring-2 ring-ink ring-offset-1",
                          gezogen === e.t.id && "opacity-30",
                        )}
                        title={e.t.titel}
                      >
                        {e.ganztags ? null : <span className="shrink-0 tabular-nums opacity-80">{hhmm(e.start)}</span>}
                        {e.t.anmeldung ? <Ticket className="size-3 shrink-0" /> : null}
                        {e.t.status === "vorbehalt" ? <Clock className="size-3 shrink-0" /> : null}
                        <span className="truncate">{e.t.titel}</span>
                      </div>
                    </TerminMenue>
                  ))}
                  {liste.length > SICHTBAR ? (
                    <button type="button" onClick={() => onTag(tag)} className="px-1.5 text-[11.5px] font-medium text-subtle hover:text-accent-ink">
                      + {liste.length - SICHTBAR} weitere
                    </button>
                  ) : null}
                </div>
                )}
              </div>
            </FlaecheMenue>
          );
        })}
      </div>
    </div>
  );
}

