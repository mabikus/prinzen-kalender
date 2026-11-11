"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clock, Ticket } from "lucide-react";
import { cn } from "@/components/ui/cn";
import type { Termin } from "@/lib/types";
import { datumKurz } from "@/lib/zeit";
import {
  begrenze,
  hhmm,
  minutenZuY,
  PX_PRO_MIN,
  RASTER_BIS,
  RASTER_VON,
  runde,
  SCHRITT,
  STUNDE_PX,
  verteile,
  type Eintrag,
} from "./geometrie";
import { FlaecheMenue, TerminMenue } from "./menue";

/** Farbe eines Termins im Kalender: Alle = rot, Auswahl = hellrot */
export function kachelStil(t: Termin) {
  return cn(
    t.umfang === "alle" && "bg-accent text-accent-fg",
    t.umfang === "auswahl" && "bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))] text-accent-ink border-l-[3px] border-accent",
    t.status === "vorbehalt" &&
      "opacity-80 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgb(255_255_255/0.22)_6px,rgb(255_255_255/0.22)_12px)]",
  );
}

type Modus = "bewegen" | "groesse" | "anlegen";

interface Zug {
  modus: Modus;
  /** Finger: nur Tippen (auswählen), Ziehen scrollt die Seite */
  touch: boolean;
  eintrag?: Eintrag;
  x0: number;
  y0: number;
  min0: number;
  tag0: number;
  aktiv: boolean;
}

interface Vorschau {
  id: string | null; // null = neuer Termin
  tagIndex: number;
  start: number;
  ende: number;
}

const HOEHE = (RASTER_BIS - RASTER_VON) * PX_PRO_MIN;

export function Zeitraster({
  tage,
  eintraege,
  heute,
  jetztMin,
  ausgewaehlt,
  onAuswahl,
  onDoppelklick,
  onVerschieben,
  onGroesse,
  onAnlegen,
  onTag,
  ohneKopf,
}: {
  /** Tageskopf weglassen (Handy: der Wochenstreifen zeigt den Tag schon) */
  ohneKopf?: boolean;
  tage: string[];
  eintraege: Eintrag[];
  heute: string;
  jetztMin: number;
  ausgewaehlt: string | null;
  onAuswahl: (id: string | null, tag?: string) => void;
  onDoppelklick: (t: Termin) => void;
  onVerschieben: (e: Eintrag, minuten: number, tage: number) => void;
  onGroesse: (e: Eintrag, ende: number) => void;
  onAnlegen: (tag: string, start: number, ende: number) => void;
  onTag: (tag: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rasterRef = useRef<HTMLDivElement>(null);
  const zug = useRef<Zug | null>(null);
  const [vorschau, setVorschauState] = useState<Vorschau | null>(null);
  const vorschauRef = useRef<Vorschau | null>(null);
  const setVorschau = useCallback((v: Vorschau | null) => {
    vorschauRef.current = v;
    setVorschauState(v);
  }, []);
  const [menueZeit, setMenueZeit] = useState<number | undefined>();

  // Beim ersten Anzeigen zur ersten Uhrzeit des Zeitraums scrollen (sonst 8 Uhr)
  const ersteZeit = Math.min(...eintraege.filter((e) => !e.ganztags).map((e) => e.start), 17 * 60);
  const scrollZiel = Math.max(RASTER_VON, Math.min(8 * 60, ersteZeit - 60));
  const tageKey = tage.join();
  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = minutenZuY(scrollZiel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tageKey]);

  /** Bildschirmpunkt → Tag (Index) und Minute (ungerundet) */
  const punkt = useCallback(
    (clientX: number, clientY: number) => {
      const r = rasterRef.current!.getBoundingClientRect();
      const breite = r.width / tage.length;
      return {
        tagIndex: begrenze(Math.floor((clientX - r.left) / breite), 0, tage.length - 1),
        min: RASTER_VON + (clientY - r.top) / PX_PRO_MIN,
      };
    },
    [tage.length],
  );

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
        document.body.style.userSelect = "none";
      }
      const p = punkt(ev.clientX, ev.clientY);
      if (z.modus === "bewegen" && z.eintrag) {
        const dauer = z.eintrag.ende - z.eintrag.start;
        const start = begrenze(z.eintrag.start + runde(p.min - z.min0), RASTER_VON, RASTER_BIS - SCHRITT);
        const tagIndex = begrenze(tage.indexOf(z.eintrag.tag) + p.tagIndex - z.tag0, 0, tage.length - 1);
        setVorschau({ id: z.eintrag.t.id, tagIndex, start, ende: Math.min(start + dauer, RASTER_BIS) });
      } else if (z.modus === "groesse" && z.eintrag) {
        const ende = begrenze(runde(p.min), z.eintrag.start + SCHRITT, RASTER_BIS);
        setVorschau({ id: z.eintrag.t.id, tagIndex: tage.indexOf(z.eintrag.tag), start: z.eintrag.start, ende });
      } else if (z.modus === "anlegen") {
        const a = runde(z.min0);
        const b = begrenze(runde(p.min), RASTER_VON, RASTER_BIS);
        setVorschau({ id: null, tagIndex: z.tag0, start: Math.min(a, b), ende: Math.max(a, b, Math.min(a, b) + SCHRITT) });
      }
    };
    const loslassen = (ev: PointerEvent) => {
      const z = zug.current;
      zug.current = null;
      document.body.style.userSelect = "";
      if (!z) return;
      const v = vorschauRef.current;
      setVorschau(null);
      if (z.aktiv && v) {
        if (z.modus === "bewegen" && z.eintrag) {
          const minuten = v.start - z.eintrag.start;
          const tageDelta = v.tagIndex - tage.indexOf(z.eintrag.tag);
          if (minuten || tageDelta) onVerschieben(z.eintrag, minuten, tageDelta);
        } else if (z.modus === "groesse" && z.eintrag) {
          if (v.ende !== z.eintrag.ende) onGroesse(z.eintrag, v.ende);
        } else if (z.modus === "anlegen") onAnlegen(tage[v.tagIndex], v.start, v.ende);
      } else if (!z.aktiv && ev.button === 0) {
        onAuswahl(z.eintrag?.t.id ?? null, z.eintrag ? undefined : tage[z.tag0]);
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
  }, [punkt, tage, onVerschieben, onGroesse, onAnlegen, onAuswahl, setVorschau]);

  const starte = (ev: React.PointerEvent, modus: Modus, eintrag?: Eintrag) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    const p = punkt(ev.clientX, ev.clientY);
    zug.current = {
      modus,
      touch: ev.pointerType === "touch",
      eintrag,
      x0: ev.clientX,
      y0: ev.clientY,
      min0: p.min,
      tag0: p.tagIndex,
      aktiv: false,
    };
  };

  const ganztags = eintraege.filter((e) => e.ganztags);
  const spalten = `repeat(${tage.length}, minmax(0, 1fr))`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Kopf: Tage */}
      <div hidden={ohneKopf} className="grid shrink-0 overflow-y-hidden border-b border-line bg-panel [scrollbar-gutter:stable]" style={{ gridTemplateColumns: `56px ${spalten}` }}>
        <div />
        {tage.map((tag) => {
          const [, , d] = tag.split("-");
          const ist = tag === heute;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTag(tag)}
              className="flex items-baseline justify-center gap-1.5 border-l border-line py-2 text-[13px] hover:bg-hover"
            >
              <span className={cn("uppercase tracking-wider text-[11px]", ist ? "text-accent-ink font-semibold" : "text-subtle")}>
                {datumKurz(tag).slice(0, 2)}
              </span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full font-display text-[17px] font-semibold lining-nums",
                  ist ? "bg-accent text-accent-fg" : "text-ink",
                )}
              >
                {Number(d)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ganztägig / ohne Uhrzeit */}
      {ganztags.length ? (
        <div className="grid shrink-0 overflow-y-hidden border-b border-line bg-panel [scrollbar-gutter:stable]" style={{ gridTemplateColumns: `56px ${spalten}` }}>
          <div className="px-1 py-1.5 text-right text-[10px] uppercase leading-tight tracking-wider text-subtle">ohne Zeit</div>
          {tage.map((tag) => (
            <div key={tag} className="min-w-0 space-y-0.5 border-l border-line p-1">
              {ganztags
                .filter((e) => e.tag === tag)
                .map((e) => (
                  <TerminMenue key={e.t.id} termin={e.t}>
                    <button
                      type="button"
                      onClick={() => onAuswahl(e.t.id)}
                      onDoubleClick={() => onDoppelklick(e.t)}
                      className={cn(
                        "block w-full truncate rounded-[5px] px-1.5 py-0.5 text-left text-[12px] font-medium",
                        kachelStil(e.t),
                        ausgewaehlt === e.t.id && "ring-2 ring-ink ring-offset-1",
                      )}
                    >
                      {e.t.titel}
                    </button>
                  </TerminMenue>
                ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* Raster */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-panel [scrollbar-gutter:stable]">
        <div className="grid" style={{ gridTemplateColumns: `56px 1fr` }}>
          <div className="relative" style={{ height: HOEHE }}>
            {Array.from({ length: (RASTER_BIS - RASTER_VON) / 60 }, (_, i) => (
              <div
                key={i}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-subtle"
                style={{ top: i * STUNDE_PX }}
              >
                {i === 0 ? "" : `${String(RASTER_VON / 60 + i).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
          <div ref={rasterRef} className="relative grid" style={{ gridTemplateColumns: spalten, height: HOEHE }}>
            {tage.map((tag, ti) => {
              const plaetze = verteile(eintraege.filter((e) => !e.ganztags && e.tag === tag));
              const ist = tag === heute;
              return (
                <FlaecheMenue key={tag} tag={tag} start={menueZeit}>
                  <div
                    data-tag={tag}
                    onPointerDown={(ev) => starte(ev, "anlegen")}
                    onContextMenu={(ev) => setMenueZeit(Math.floor(punkt(ev.clientX, ev.clientY).min / 30) * 30)}
                    onDoubleClick={(ev) => {
                      if (ev.target !== ev.currentTarget) return;
                      const m = Math.floor(punkt(ev.clientX, ev.clientY).min / 30) * 30;
                      onAnlegen(tag, m, m + 120);
                    }}
                    className={cn("relative border-l border-line", ist && "bg-[color-mix(in_srgb,var(--accent)_3%,transparent)]")}
                    style={{
                      backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0, var(--line) 1px, transparent 1px, transparent ${STUNDE_PX / 2}px), repeating-linear-gradient(to bottom, var(--line-strong) 0, var(--line-strong) 1px, transparent 1px, transparent ${STUNDE_PX}px)`,
                      backgroundBlendMode: "normal",
                    }}
                  >
                    {plaetze.map(({ eintrag: e, spalte, spalten: n }) => {
                      const bewegt = vorschau?.id === e.t.id;
                      return (
                        <Kachel
                          key={e.t.id}
                          e={e}
                          oben={minutenZuY(e.start)}
                          hoehe={(e.ende - e.start) * PX_PRO_MIN}
                          links={`calc(${(spalte / n) * 100}% + 2px)`}
                          breite={`calc(${100 / n}% - 4px)`}
                          ausgewaehlt={ausgewaehlt === e.t.id}
                          blass={bewegt}
                          onPointerDown={(ev) => starte(ev, "bewegen", e)}
                          onGroesse={(ev) => starte(ev, "groesse", e)}
                          onDoppelklick={() => onDoppelklick(e.t)}
                        />
                      );
                    })}
                    {vorschau && vorschau.tagIndex === ti ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-x-1 z-20 rounded-[6px] px-1.5 py-1 text-[11.5px] font-semibold shadow-[var(--shadow-pop)]",
                          vorschau.id ? "bg-accent/90 text-accent-fg" : "border-2 border-dashed border-accent bg-accent-soft text-accent-ink",
                        )}
                        style={{ top: minutenZuY(vorschau.start), height: (vorschau.ende - vorschau.start) * PX_PRO_MIN }}
                      >
                        {hhmm(vorschau.start)} – {hhmm(vorschau.ende)}
                        {vorschau.id ? null : <span className="block font-normal">Neuer Termin</span>}
                      </div>
                    ) : null}
                    {ist && jetztMin >= RASTER_VON && jetztMin <= RASTER_BIS ? (
                      <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-accent" style={{ top: minutenZuY(jetztMin) }}>
                        <span className="absolute -left-1 -top-[3px] size-2 rounded-full bg-accent" />
                      </div>
                    ) : null}
                  </div>
                </FlaecheMenue>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kachel({
  e,
  oben,
  hoehe,
  links,
  breite,
  ausgewaehlt,
  blass,
  onPointerDown,
  onGroesse,
  onDoppelklick,
}: {
  e: Eintrag;
  oben: number;
  hoehe: number;
  links: string;
  breite: string;
  ausgewaehlt: boolean;
  blass: boolean;
  onPointerDown: (ev: React.PointerEvent) => void;
  onGroesse: (ev: React.PointerEvent) => void;
  onDoppelklick: () => void;
}) {
  const t = e.t;
  const klein = hoehe < 34;
  return (
    <TerminMenue termin={t}>
      <div
        role="button"
        tabIndex={-1}
        data-termin={t.id}
        onPointerDown={onPointerDown}
        onDoubleClick={(ev) => {
          ev.stopPropagation();
          onDoppelklick();
        }}
        className={cn(
          "group @container absolute z-[1] cursor-grab overflow-hidden rounded-[6px] px-1.5 text-[12px] leading-tight shadow-[0_1px_2px_rgb(31_26_23/0.12)] transition-[opacity,box-shadow] active:cursor-grabbing",
          kachelStil(t),
          klein ? "flex items-center gap-1 py-0" : "py-1",
          ausgewaehlt && "z-[5] ring-2 ring-ink ring-offset-1 ring-offset-panel",
          blass && "opacity-30",
        )}
        style={{ top: oben, height: Math.max(hoehe - 2, 16), left: links, width: breite }}
        title={`${hhmm(e.start)}–${hhmm(e.ende)} ${t.titel}`}
      >
        <div className={cn("flex items-center gap-1 whitespace-nowrap tabular-nums", klein ? "shrink-0 text-[11px] opacity-90" : "text-[11px] opacity-90")}>
          {hhmm(e.start)}
          {klein ? null : <span className="hidden @[7.5rem]:inline">– {hhmm(e.ende)}</span>}
          {t.anmeldung ? <Ticket className="size-3" /> : null}
          {t.status === "vorbehalt" ? <Clock className="size-3" /> : null}
        </div>
        <div className={cn("font-semibold", klein ? "truncate" : "line-clamp-2")}>{t.titel}</div>
        {!klein && hoehe > 58 && (t.treffpunkt || t.ort) ? <div className="truncate opacity-80">{t.treffpunkt ?? t.ort}</div> : null}
        <div
          onPointerDown={onGroesse}
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100"
          aria-hidden
        >
          <div className="mx-auto mt-0.5 h-[3px] w-6 rounded-full bg-current opacity-50" />
        </div>
      </div>
    </TerminMenue>
  );
}
