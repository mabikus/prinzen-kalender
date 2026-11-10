"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./cn";
import { Select } from "./controls";
import { EmptyState, Kbd } from "./display";

/**
 * Liste im Design der KBN-App: weiße Pills mit Zahlen, Suche mit „/“, sortierbare Spalten, kompakte Zeilen,
 * Gruppen (z. B. Monat) als Marke auf der Trennlinie, Blätterleiste – am Handy Karten statt Tabelle.
 * Alles im Browser (die Listen der Verwaltung sind klein), sortiert/gefiltert/geblättert hier.
 */

export interface Spalte<T> {
  id: string;
  titel: string;
  zelle: (z: T) => ReactNode;
  /** Wert zum Sortieren; ohne = nicht sortierbar */
  sortWert?: (z: T) => string | number | null | undefined;
  rechts?: boolean;
  /** Breite der Spalte (z. B. "120px" oder "18%"); sonst teilen sich die übrigen den Platz */
  breite?: string;
  /** Text für den Tooltip, wenn die Zelle abgeschnitten wird */
  titelText?: (z: T) => string | undefined;
}

export interface Pille<T> {
  wert: string;
  titel: string;
  passt: (z: T) => boolean;
  /** Zahl farbig hervorheben (z. B. „Prüfen“), nur wenn > 0 */
  hervorheben?: boolean;
}

type Richtung = "asc" | "desc";

const vergleich = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

export function DatenTabelle<T>({
  zeilen,
  schluessel,
  spalten,
  pillen,
  pilleStart,
  suchtext,
  suchPlatzhalter = "Suchen …",
  sortStart,
  gruppe,
  aufZeile,
  aktionen,
  karte,
  zeilenTon,
  seitengroesse = 20,
  werkzeuge,
  leerTitel = "Keine Einträge",
  leerText,
}: {
  zeilen: T[];
  schluessel: (z: T) => string;
  spalten: Spalte<T>[];
  pillen?: Pille<T>[];
  pilleStart?: string;
  suchtext?: (z: T) => string;
  suchPlatzhalter?: string;
  sortStart?: { id: string; richtung: Richtung };
  /** Gruppe einer Zeile (z. B. Monat) – nur angezeigt, solange nach der Start-Spalte sortiert wird */
  gruppe?: (z: T) => string;
  aufZeile?: (z: T) => void;
  aktionen?: (z: T) => ReactNode;
  /** Darstellung am Handy (Karte); ohne = Zellen untereinander */
  karte?: (z: T) => ReactNode;
  /** Zeile gedämpft (z. B. vergangen) */
  zeilenTon?: (z: T) => "gedaempft" | undefined;
  seitengroesse?: number;
  /** Knöpfe rechts neben der Suche */
  werkzeuge?: ReactNode;
  leerTitel?: string;
  leerText?: string;
}) {
  const [pille, setPille] = useState(pilleStart ?? pillen?.[0]?.wert ?? "");
  const [suche, setSuche] = useState("");
  const [sort, setSort] = useState<{ id: string; richtung: Richtung } | null>(sortStart ?? null);
  const [seite, setSeite] = useState(1);
  const [groesse, setGroesse] = useState(seitengroesse);
  const suchfeld = useRef<HTMLInputElement>(null);

  // „/“ springt in die Suche (wie in KBN)
  useEffect(() => {
    if (!suchtext) return;
    const taste = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || ziel.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      suchfeld.current?.focus();
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [suchtext]);

  const aktivePille = pillen?.find((p) => p.wert === pille);
  const gefiltert = useMemo(() => {
    const q = suche.trim().toLocaleLowerCase("de");
    return zeilen.filter((z) => (!aktivePille || aktivePille.passt(z)) && (!q || !suchtext || suchtext(z).toLocaleLowerCase("de").includes(q)));
  }, [zeilen, aktivePille, suche, suchtext]);

  const sortiert = useMemo(() => {
    const spalte = sort ? spalten.find((s) => s.id === sort.id) : undefined;
    if (!spalte?.sortWert || !sort) return gefiltert;
    const f = sort.richtung === "asc" ? 1 : -1;
    return [...gefiltert].sort((a, b) => {
      const x = spalte.sortWert!(a);
      const y = spalte.sortWert!(b);
      // Leere Werte immer ans Ende
      if (x == null || x === "") return y == null || y === "" ? 0 : 1;
      if (y == null || y === "") return -1;
      return f * (typeof x === "number" && typeof y === "number" ? x - y : vergleich.compare(String(x), String(y)));
    });
  }, [gefiltert, sort, spalten]);

  const seiten = Math.max(1, Math.ceil(sortiert.length / groesse));
  const aktuell = Math.min(seite, seiten);
  const sichtbar = sortiert.slice((aktuell - 1) * groesse, aktuell * groesse);
  const mitGruppen = !!gruppe && !!sort && sort.id === sortStart?.id;

  const sortieren = (id: string) => {
    setSeite(1);
    setSort((s) => (s?.id !== id ? { id, richtung: "asc" } : s.richtung === "asc" ? { id, richtung: "desc" } : sortStart ?? null));
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {pillen?.length ? (
        <fieldset
          aria-label="Auswahl"
          className="-mx-4 -my-1 flex min-w-0 gap-2 overflow-x-auto border-0 px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {pillen.map((p) => {
            const an = p.wert === pille;
            const zahl = zeilen.filter(p.passt).length;
            const stark = p.hervorheben && zahl > 0;
            return (
              <button
                key={p.wert}
                type="button"
                aria-pressed={an}
                onClick={() => {
                  setPille(p.wert);
                  setSeite(1);
                }}
                className={cn(
                  "ui-control inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-3.5 pr-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150",
                  an
                    ? "bg-accent text-accent-fg shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--accent)_70%,transparent)]"
                    : "bg-panel text-muted shadow-[var(--shadow-card)] hover:text-ink hover:shadow-[0_0_0_1px_var(--line-strong),0_6px_16px_-8px_rgb(15_23_42/0.18)]",
                )}
              >
                {p.titel}
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold leading-none tabular",
                    stark && !an ? "bg-accent text-accent-fg" : an ? "bg-white/20 text-accent-fg" : "bg-hover text-muted",
                  )}
                >
                  {zahl}
                </span>
              </button>
            );
          })}
        </fieldset>
      ) : null}

      {suchtext || werkzeuge ? (
        <div className="flex flex-wrap items-center gap-2">
          {suchtext ? (
            <div className="relative flex h-9 w-full items-center sm:w-[360px]">
              <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
              <input
                ref={suchfeld}
                type="search"
                value={suche}
                onChange={(e) => {
                  setSuche(e.target.value);
                  setSeite(1);
                }}
                onKeyDown={(e) => e.key === "Escape" && (setSuche(""), e.currentTarget.blur())}
                placeholder={suchPlatzhalter}
                aria-label={suchPlatzhalter}
                className="ui-control h-9 w-full rounded-[var(--radius-control)] bg-elevated pl-9 pr-9 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none placeholder:text-subtle hover:shadow-[inset_0_0_0_1px_var(--subtle)] focus:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_var(--accent-soft)] [&::-webkit-search-cancel-button]:hidden"
              />
              <div className="absolute right-2 flex items-center">
                {suche ? (
                  <button
                    type="button"
                    onClick={() => setSuche("")}
                    aria-label="Suche leeren"
                    className="grid size-6 place-items-center rounded-md text-subtle hover:bg-hover hover:text-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <Kbd className="pointer-coarse:hidden">/</Kbd>
                )}
              </div>
            </div>
          ) : null}
          {werkzeuge ? <div className="ml-auto flex flex-wrap items-center gap-2">{werkzeuge}</div> : null}
        </div>
      ) : null}

      {sichtbar.length === 0 ? (
        <EmptyState
          title={suche ? `Nichts zu „${suche.trim()}“` : leerTitel}
          text={suche ? "Versuch es mit einem anderen Wort." : leerText}
          className="rounded-[var(--radius-card)] bg-panel shadow-[var(--shadow-card)]"
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-[var(--shadow-card)]">
          {/* Handy: Karten */}
          <ul className="divide-y divide-line md:hidden">
            {sichtbar.map((z, i) => {
              const g = mitGruppen ? gruppe!(z) : null;
              const neueGruppe = g !== null && (i === 0 || gruppe!(sichtbar[i - 1]) !== g);
              return (
                <Fragment key={schluessel(z)}>
                  {neueGruppe ? <li className="bg-bg/60 px-4 py-1.5 text-[12px] font-semibold text-ink">{g}</li> : null}
                  <li className={cn("flex items-center gap-2 px-4 py-3", zeilenTon?.(z) === "gedaempft" && "opacity-55")}>
                    <button
                      type="button"
                      onClick={aufZeile ? () => aufZeile(z) : undefined}
                      disabled={!aufZeile}
                      className="min-w-0 flex-1 text-left disabled:cursor-default"
                    >
                      {karte ? (
                        karte(z)
                      ) : (
                        <span className="grid gap-0.5 text-[13.5px]">
                          {spalten.map((s) => (
                            <span key={s.id} className="truncate">
                              {s.zelle(z)}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                    {aktionen?.(z)}
                  </li>
                </Fragment>
              );
            })}
          </ul>

          {/* PC: Tabelle */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                {spalten.map((s) => (
                  <col key={s.id} style={s.breite ? { width: s.breite } : undefined} />
                ))}
                {aktionen ? <col style={{ width: 52 }} /> : null}
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  {spalten.map((s) => {
                    const dir = sort?.id === s.id ? sort.richtung : null;
                    return (
                      <th
                        key={s.id}
                        aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                        className={cn(
                          "h-9 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle first:pl-4 last:pr-4",
                          s.rechts && "text-right",
                        )}
                      >
                        {s.sortWert ? (
                          <button
                            type="button"
                            onClick={() => sortieren(s.id)}
                            className={cn(
                              "-mx-1.5 inline-flex max-w-[calc(100%+0.75rem)] items-center gap-1 rounded px-1.5 py-1 uppercase hover:bg-hover hover:text-ink",
                              dir && "text-ink",
                            )}
                          >
                            <span className="min-w-0 truncate">{s.titel}</span>
                            {dir === "asc" ? (
                              <ArrowUp className="size-3 shrink-0" />
                            ) : dir === "desc" ? (
                              <ArrowDown className="size-3 shrink-0" />
                            ) : (
                              <ArrowUpDown className="size-3 shrink-0 opacity-40" />
                            )}
                          </button>
                        ) : (
                          <span className="truncate">{s.titel}</span>
                        )}
                      </th>
                    );
                  })}
                  {aktionen ? <th className="h-9 pr-4" aria-label="Aktionen" /> : null}
                </tr>
              </thead>
              <tbody>
                {sichtbar.map((z, i) => {
                  const g = mitGruppen ? gruppe!(z) : null;
                  const neueGruppe = g !== null && (i === 0 || gruppe!(sichtbar[i - 1]) !== g);
                  return (
                    <tr
                      key={schluessel(z)}
                      tabIndex={aufZeile ? 0 : undefined}
                      onClick={
                        aufZeile
                          ? (e) => {
                              if ((e.target as HTMLElement).closest("button, a, [role=menuitem]")) return;
                              aufZeile(z);
                            }
                          : undefined
                      }
                      onKeyDown={aufZeile ? (e) => e.key === "Enter" && e.target === e.currentTarget && aufZeile(z) : undefined}
                      className={cn(
                        "group border-b border-line transition-colors last:border-0 hover:bg-hover/60",
                        aufZeile && "cursor-pointer outline-none focus-visible:bg-hover focus-visible:shadow-[inset_2px_0_0_var(--accent)]",
                        zeilenTon?.(z) === "gedaempft" && "text-subtle [&_td]:opacity-60",
                      )}
                    >
                      {spalten.map((s, j) => (
                        <td
                          key={s.id}
                          title={s.titelText?.(z)}
                          className={cn(
                            "px-3 py-2 text-[14px] text-ink first:pl-4 last:pr-4",
                            s.rechts && "text-right tabular",
                            j === 0 && neueGruppe && "relative",
                          )}
                        >
                          {/* Gruppe als ruhige Marke auf der Trennlinie statt als eigene Zeile (wie KBN) */}
                          {j === 0 && neueGruppe ? (
                            <span className="pointer-events-none absolute left-2.5 top-0 z-[1] -translate-y-1/2 whitespace-nowrap rounded-full bg-panel px-1.5 text-[12px] font-semibold leading-4 text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]">
                              {g}
                            </span>
                          ) : null}
                          <div className="min-w-0 truncate">{s.zelle(z)}</div>
                        </td>
                      ))}
                      {aktionen ? <td className="py-1.5 pr-3 text-right">{aktionen(z)}</td> : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blätterleiste */}
      {sortiert.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-subtle">
          <div className="flex items-center gap-3">
            <span className="tabular">
              {(aktuell - 1) * groesse + 1}–{Math.min(sortiert.length, aktuell * groesse)} von {sortiert.length}
            </span>
            <span className="hidden sm:inline">Pro Seite</span>
            <div className="w-[76px]">
              <Select
                value={String(groesse)}
                onValueChange={(v) => {
                  setGroesse(Number(v));
                  setSeite(1);
                }}
                options={[10, 20, 50, 100].map((s) => ({ value: String(s), label: String(s) }))}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          {seiten > 1 ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Vorherige Seite" disabled={aktuell <= 1} onClick={() => setSeite(aktuell - 1)}>
                <ChevronLeft />
              </Button>
              {seitenNummern(aktuell, seiten).map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeite(n)}
                    aria-current={n === aktuell ? "page" : undefined}
                    className={cn("h-8 min-w-8 rounded-md px-2 tabular hover:bg-hover hover:text-ink", n === aktuell && "bg-active font-semibold text-ink")}
                  >
                    {n}
                  </button>
                ),
              )}
              <Button variant="ghost" size="icon-sm" aria-label="Nächste Seite" disabled={aktuell >= seiten} onClick={() => setSeite(aktuell + 1)}>
                <ChevronRight />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function seitenNummern(seite: number, seiten: number): (number | "…")[] {
  const n: (number | "…")[] = [];
  for (let p = 1; p <= seiten; p++) {
    if (p === 1 || p === seiten || Math.abs(p - seite) <= 1) n.push(p);
    else if (n[n.length - 1] !== "…") n.push("…");
  }
  return n;
}
