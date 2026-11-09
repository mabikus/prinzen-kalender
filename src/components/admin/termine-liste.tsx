"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CircleHelp, Clock, Copy, MoreHorizontal, Pencil, Plus, Search, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Segmented } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/display";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { PageHeader } from "@/components/ui/page";
import { personenBedarf, werText } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { datumKurz, jetztInBerlin, MONATE, startzeit } from "@/lib/zeit";
import { useTerminAktionen } from "./termin-aktionen";

type Ansicht = "kommend" | "alle" | "pruefen" | "karten";

export function TermineListe({ termine, gruppen }: { termine: Termin[]; gruppen: Gruppe[] }) {
  const [suche, setSuche] = useState("");
  const [ansicht, setAnsicht] = useState<Ansicht>("kommend");
  const router = useRouter();
  const aktionen = useTerminAktionen();
  const [heute] = useState(() => jetztInBerlin().datum);

  const liste = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return termine.filter((t) => {
      if (ansicht === "kommend" && t.datum < heute) return false;
      if (ansicht === "pruefen" && !t.pruefen) return false;
      if (ansicht === "karten" && !t.anmeldung) return false;
      if (!q) return true;
      return [t.titel, t.tagesprogramm, t.treffpunkt, t.ort, t.veranstalter, t.bemerkung, datumKurz(t.datum)]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [termine, suche, ansicht, heute]);

  const monate = useMemo(() => {
    const m = new Map<string, Termin[]>();
    for (const t of liste) {
      const k = t.datum.slice(0, 7);
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return [...m];
  }, [liste]);

  return (
    <>
      <PageHeader
        eyebrow="Session 2026/27"
        title="Termine"
        description={`${termine.length} Termine insgesamt`}
        actions={
          <Button asChild variant="primary">
            <Link href="/verwaltung/termine/neu">
              <Plus />
              Neuer Termin
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Titel, Ort, Veranstalter …"
            aria-label="Termine durchsuchen"
            className="pl-9"
          />
        </div>
        <Segmented<Ansicht>
          value={ansicht}
          onChange={setAnsicht}
          label="Auswahl"
          options={[
            { value: "kommend", label: "Kommend" },
            { value: "alle", label: "Alle" },
            { value: "pruefen", label: "Prüfen", icon: <CircleHelp /> },
            { value: "karten", label: "Karten", icon: <Ticket /> },
          ]}
        />
      </div>

      {liste.length === 0 ? (
        <EmptyState title="Keine Termine" text="Mit dieser Auswahl gibt es keine Termine." />
      ) : (
        <div className="space-y-6">
          {monate.map(([monat, ts]) => {
            const [j, m] = monat.split("-").map(Number);
            return (
              <section key={monat}>
                <h2 className="mb-2 flex items-baseline gap-2 px-1">
                  <span className="font-display text-xl font-semibold text-accent-ink">{MONATE[m - 1]}</span>
                  <span className="text-[13px] text-subtle">{j}</span>
                </h2>
                <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
                  {ts.map((t) => {
                    const b = t.anmeldung ? personenBedarf(t, gruppen) : null;
                    return (
                      <li key={t.id} className={cn("group flex items-center gap-3 px-4 py-2.5 hover:bg-hover", t.datum < heute && "opacity-60")}>
                        <button
                          type="button"
                          onClick={() => router.push(`/verwaltung/termine/${encodeURIComponent(t.id)}`)}
                          className="flex min-w-0 flex-1 items-center gap-4 text-left"
                        >
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
                              {t.pruefen ? <CircleHelp className="size-3.5 shrink-0 text-subtle" aria-label="Noch prüfen" /> : null}
                            </span>
                            <span className="block truncate text-[12.5px] text-subtle">
                              {[t.treffpunkt ?? t.ort, werText(t, gruppen)].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {b ? (
                            <span
                              className={cn(
                                "hidden shrink-0 items-center gap-1 text-[12.5px] sm:inline-flex",
                                t.karten_bestellt == null || t.karten_bestellt < b.summe ? "text-accent-ink" : "text-subtle",
                              )}
                            >
                              <Ticket className="size-3.5" />
                              {t.karten_bestellt ?? 0}/{b.summe}
                              {b.ohneAngabe.length ? "+" : ""}
                            </span>
                          ) : null}
                        </button>
                        <Menu>
                          <MenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Aktionen">
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
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
