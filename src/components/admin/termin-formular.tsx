"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Check, CircleHelp, Ticket, TriangleAlert } from "lucide-react";
import { terminSpeichern, type TerminEingabe } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Segmented } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { personenBedarf } from "@/lib/labels";
import type { Gruppe, Termin, Umfang } from "@/lib/types";

export type Vorlage = Partial<Pick<Termin, "datum" | "treffzeit" | "beginn" | "ende">>;

function leererTermin(v: Vorlage = {}): TerminEingabe {
  return {
    datum: v.datum ?? "",
    treffzeit: v.treffzeit ?? null,
    treffpunkt: null,
    beginn: v.beginn ?? null,
    ort: null,
    ende: v.ende ?? null,
    anschluss_an: null,
    titel: "",
    tagesprogramm: null,
    veranstalter: null,
    art: "extern",
    status: "bestaetigt",
    umfang: "auswahl",
    gruppen: ["prinz"],
    anmeldung: null,
    karten_bestellt: null,
    hinweis: null,
    bemerkung: null,
    pruefen: null,
  };
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-[var(--radius-card)] border border-line bg-panel p-4 sm:p-5">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink">{titel}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Termin anlegen oder bearbeiten – auf eigener Seite und im Kalender-Dialog.
 * `onGespeichert` bekommt den gespeicherten Termin (z. B. Dialog schließen, Kalender aktualisieren).
 */
export function TerminFormular({
  termin,
  vorlage,
  gruppen,
  alleTermine,
  onGespeichert,
  onAbbrechen,
  formId = "termin-formular",
  ohneAktionen,
}: {
  termin: Termin | null;
  vorlage?: Vorlage;
  gruppen: Gruppe[];
  alleTermine: Termin[];
  onGespeichert: (t: Termin) => void;
  onAbbrechen?: () => void;
  formId?: string;
  /** Knöpfe nicht anzeigen (der Dialog hat eigene) */
  ohneAktionen?: boolean;
}) {
  const [w, setW] = useState<TerminEingabe>(() => (termin ? { ...termin } : leererTermin(vorlage)));
  const [fehler, setFehler] = useState<string>();
  const [laeuft, starte] = useTransition();
  const setze = <K extends keyof TerminEingabe>(k: K, v: TerminEingabe[K]) => setW((x) => ({ ...x, [k]: v }));
  const text = (k: keyof TerminEingabe) => ({
    value: (w[k] as string | null) ?? "",
    onChange: (e: { target: { value: string } }) => setze(k, (e.target.value || null) as never),
  });

  const orte = useMemo(
    () => [...new Set(alleTermine.flatMap((t) => [t.treffpunkt, t.ort]).filter(Boolean) as string[])].sort(),
    [alleTermine],
  );
  const programme = useMemo(
    () => [...new Set(alleTermine.map((t) => t.tagesprogramm).filter(Boolean) as string[])].sort(),
    [alleTermine],
  );
  const veranstalter = useMemo(
    () => [...new Set(alleTermine.map((t) => t.veranstalter).filter(Boolean) as string[])].sort(),
    [alleTermine],
  );
  const selberTag = alleTermine.filter((t) => t.datum === w.datum && t.id !== termin?.id);

  const auto = (g: Gruppe) => w.umfang !== "auswahl" && g.in_alle;
  const umschalten = (id: string) =>
    setze("gruppen", w.gruppen.includes(id) ? w.gruppen.filter((g) => g !== id) : [...w.gruppen, id]);
  const bedarf = personenBedarf({ ...(w as Termin), id: termin?.id ?? "", quelle: [] }, gruppen);

  const speichern = (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(undefined);
    // Bei "Alle"/"Jeder Verfügbare" nur die Extras speichern (z. B. Familie)
    const eingabe: TerminEingabe = {
      ...w,
      id: termin?.id,
      gruppen: w.umfang === "auswahl" ? w.gruppen : w.gruppen.filter((id) => !gruppen.find((g) => g.id === id)?.in_alle),
    };
    starte(async () => {
      const r = await terminSpeichern(eingabe);
      if (!r.ok) {
        setFehler(r.fehler);
        return;
      }
      toast.success(termin ? "Termin gespeichert" : "Termin angelegt");
      onGespeichert(r.daten);
    });
  };

  return (
    <form id={formId} onSubmit={speichern} className="space-y-5">
      <datalist id="pk-orte">
        {orte.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <datalist id="pk-programme">
        {programme.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id="pk-veranstalter">
        {veranstalter.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      {fehler ? (
        <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-control)] bg-accent-soft p-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {fehler}
        </p>
      ) : null}

      <Abschnitt titel="Was & wann">
        <Field label="Titel" required>
          <Input required value={w.titel} onChange={(e) => setze("titel", e.target.value)} autoFocus={!termin} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Field label="Datum" required>
            <Input type="date" required value={w.datum} onChange={(e) => setze("datum", e.target.value)} />
          </Field>
          <Field label="Status">
            <Segmented
              value={w.status}
              onChange={(v) => setze("status", v)}
              options={[
                { value: "bestaetigt", label: "bestätigt" },
                { value: "vorbehalt", label: "Vorbehalt" },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Treffzeit" hint="Ab hier steht der Termin im Kalender.">
            <Input type="time" {...text("treffzeit")} />
          </Field>
          <Field label="Treffpunkt">
            <Input list="pk-orte" {...text("treffpunkt")} />
          </Field>
          <Field label="Beginn">
            <Input type="time" {...text("beginn")} />
          </Field>
          <Field label="Ort (falls anders)">
            <Input list="pk-orte" {...text("ort")} />
          </Field>
          <Field label="Ende" hint="Optional, sonst geschätzt.">
            <Input type="time" {...text("ende")} />
          </Field>
          <Field label="Im Anschluss an">
            <NativeSelect value={w.anschluss_an ?? ""} onChange={(e) => setze("anschluss_an", e.target.value || null)}>
              <option value="">–</option>
              {selberTag.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titel}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Veranstalter">
            <Input list="pk-veranstalter" {...text("veranstalter")} />
          </Field>
          <Field label="Intern / Extern">
            <Segmented
              value={w.art}
              onChange={(v) => setze("art", v)}
              options={[
                { value: "intern", label: "Intern" },
                { value: "extern", label: "Extern" },
              ]}
            />
          </Field>
        </div>
        <Field label="Tagesprogramm" hint="Gleicher Name am selben Tag fasst Termine zusammen, z. B. „Weiberdonnerstag“.">
          <Input list="pk-programme" {...text("tagesprogramm")} />
        </Field>
      </Abschnitt>

      <Abschnitt titel="Wer ist dabei?">
        <Segmented<Umfang>
          value={w.umfang}
          onChange={(v) => setze("umfang", v)}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { value: "alle", label: "Alle" },
            { value: "jeder_verfuegbare", label: "Jeder Verfügbare" },
            { value: "auswahl", label: "Auswahl" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {gruppen.map((g) => {
            const a = auto(g);
            const an = a || w.gruppen.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                role="checkbox"
                aria-checked={an}
                disabled={a}
                onClick={() => umschalten(g.id)}
                title={g.beschreibung ?? undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-[var(--radius-control)] px-3 text-[13px] font-medium transition-colors",
                  an
                    ? "bg-accent-soft text-accent-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                    : "bg-elevated text-muted shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-ink",
                  a && "cursor-default opacity-70",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-[4px]",
                    an ? "bg-accent text-accent-fg" : "shadow-[inset_0_0_0_1px_var(--line-strong)]",
                  )}
                >
                  {an ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                {g.name}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          {w.umfang === "auswahl" ? (
            <>
              <Button
                variant="link"
                size="sm"
                onClick={() => setze("gruppen", [...new Set([...w.gruppen, ...gruppen.filter((g) => g.in_alle).map((g) => g.id)])])}
              >
                alle ankreuzen
              </Button>
              <Button variant="link" size="sm" className="text-subtle" onClick={() => setze("gruppen", [])}>
                keine
              </Button>
            </>
          ) : null}
          <span className="ml-auto text-subtle">
            ca. <strong className="tabular text-ink">{bedarf.summe}</strong>
            {bedarf.ohneAngabe.length ? "+" : ""} Personen
          </span>
        </div>
      </Abschnitt>

      <Abschnitt titel="Karten / Anmeldung">
        <Segmented
          value={w.anmeldung ?? "keine"}
          onChange={(v) => setze("anmeldung", v === "keine" ? null : v)}
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { value: "keine", label: "Nicht nötig" },
            { value: "eintrittskarte", label: "Eintrittskarte", icon: <Ticket /> },
            { value: "voranmeldung", label: "Voranmeldung" },
          ]}
        />
        {w.anmeldung ? (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Benötigt (aus Gruppen)">
              <Input value={`${bedarf.summe}${bedarf.ohneAngabe.length ? "+" : ""}`} readOnly className="tabular" />
            </Field>
            <Field label="Bereits bestellt">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={w.karten_bestellt ?? ""}
                onChange={(e) => setze("karten_bestellt", e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          </div>
        ) : null}
      </Abschnitt>

      <Abschnitt titel="Hinweise">
        <Field label="Wichtiger Hinweis" hint="Wird rot hervorgehoben, z. B. „Abfahrt 12:00 Uhr!“">
          <Input {...text("hinweis")} />
        </Field>
        <Field label="Bemerkung">
          <Textarea rows={2} {...text("bemerkung")} />
        </Field>
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <CircleHelp className="size-3.5" /> Noch prüfen
            </span>
          }
          hint="Offene Frage – leeren, sobald geklärt."
        >
          <Input {...text("pruefen")} />
        </Field>
      </Abschnitt>

      {ohneAktionen ? null : (
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-[var(--radius-card)] sm:border sm:px-4">
          {onAbbrechen ? (
            <Button variant="ghost" onClick={onAbbrechen}>
              Abbrechen
            </Button>
          ) : null}
          <Button type="submit" variant="primary" loading={laeuft}>
            {termin ? "Speichern" : "Termin anlegen"}
          </Button>
        </div>
      )}
      {ohneAktionen ? (
        <button type="submit" hidden aria-hidden tabIndex={-1} disabled={laeuft} />
      ) : null}
    </form>
  );
}
