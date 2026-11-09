"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Check, ChevronDown, Minus, Plus, Ticket, TriangleAlert, X } from "lucide-react";
import { terminSpeichern, type TerminEingabe } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Segmented } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { personenBedarf } from "@/lib/labels";
import type { Gruppe, Termin, Umfang } from "@/lib/types";
import { datumLang } from "@/lib/zeit";

export type Vorlage = Partial<Pick<Termin, "datum" | "treffzeit" | "beginn" | "ende">>;

function leererTermin(v: Vorlage = {}): TerminEingabe {
  return {
    datum: v.datum ?? "",
    treffzeit: v.treffzeit ?? null,
    treffpunkt: null,
    beginn: v.beginn ?? null,
    ort: null,
    strasse: null,
    plz: null,
    stadt: null,
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

// ───────────── Bausteine im Stil einer iOS-Liste ─────────────

/** Gruppierte Liste mit Überschrift und Fußnote (wie in den iPhone-Einstellungen) */
function Liste({ titel, fuss, children }: { titel?: string; fuss?: ReactNode; children: ReactNode }) {
  return (
    <section>
      {titel ? (
        <h3 className="px-4 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-subtle">{titel}</h3>
      ) : null}
      <div className="divide-y divide-line overflow-hidden rounded-[12px] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
        {children}
      </div>
      {fuss ? <p className="px-4 pt-1.5 text-[13px] leading-snug text-subtle">{fuss}</p> : null}
    </section>
  );
}

/** Zeile: Bezeichnung links, Wert rechts – die ganze Zeile ist antippbar */
function Zeile({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-h-[52px] cursor-pointer items-center gap-3 px-4 py-1.5", className)}>
      <span className="shrink-0 text-[16px] text-ink">{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</span>
    </label>
  );
}

const textfeld =
  "w-full min-w-0 bg-transparent text-[16px] text-ink outline-none placeholder:text-subtle/70 focus:placeholder:text-subtle/40";

/** Freies Textfeld als ganze Zeile (Titel, Treffpunkt …) */
function TextZeile({
  label,
  wert,
  setze,
  platzhalter,
  gross,
  liste,
  pflicht,
  autoFocus,
  autoComplete = "off",
}: {
  /** Kleine Bezeichnung links (bei ausgefüllten Feldern sonst nicht erkennbar) */
  label?: string;
  wert: string | null;
  setze: (v: string | null) => void;
  platzhalter: string;
  gross?: boolean;
  liste?: string;
  pflicht?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex min-h-[52px] items-center gap-3 px-4">
      {label ? <span className="w-[8rem] shrink-0 text-[15px] text-subtle">{label}</span> : null}
      <input
        value={wert ?? ""}
        onChange={(e) => setze(e.target.value || null)}
        placeholder={platzhalter}
        aria-label={platzhalter}
        list={liste}
        required={pflicht}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={cn(textfeld, gross && "font-display text-[20px] font-semibold")}
      />
    </label>
  );
}

/**
 * Datum oder Uhrzeit: zeigt den Wert rechts, die native Auswahl (iPhone: Rad, PC: Kalender/Uhr) öffnet
 * sich beim Tippen auf die Zeile. Optionale Werte lassen sich mit × leeren.
 */
function ZeitZeile({
  label,
  typ,
  wert,
  setze,
  anzeige,
  leerText = "–",
  loeschbar,
  pflicht,
}: {
  label: string;
  typ: "date" | "time";
  wert: string | null;
  setze: (v: string | null) => void;
  anzeige?: string;
  leerText?: string;
  loeschbar?: boolean;
  pflicht?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const oeffnen = () => {
    try {
      ref.current?.showPicker?.();
    } catch {
      ref.current?.focus();
    }
  };
  return (
    <div className="relative flex min-h-[52px] items-center gap-3 px-4">
      <span className="shrink-0 text-[16px] text-ink">{label}</span>
      <button
        type="button"
        onClick={oeffnen}
        className={cn(
          "relative ml-auto rounded-[8px] px-3 py-1.5 text-[16px] tabular-nums",
          wert ? "bg-active font-medium text-ink" : "text-subtle",
        )}
      >
        {wert ? (anzeige ?? wert) : leerText}
        {/* Das echte Feld liegt unsichtbar über dem Knopf – so öffnet iOS beim Tippen das Rad */}
        <input
          ref={ref}
          type={typ}
          value={wert ?? ""}
          required={pflicht}
          onChange={(e) => setze(e.target.value || null)}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </button>
      {loeschbar && wert ? (
        <button
          type="button"
          onClick={() => setze(null)}
          aria-label={`${label} leeren`}
          className="grid size-7 place-items-center rounded-full bg-active text-subtle hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

/** Auswahl als Zeile (natives Menü) */
function AuswahlZeile({
  label,
  wert,
  setze,
  optionen,
}: {
  label: string;
  wert: string;
  setze: (v: string) => void;
  optionen: { value: string; label: string }[];
}) {
  const aktuell = optionen.find((o) => o.value === wert)?.label ?? "–";
  return (
    <label className="relative flex min-h-[52px] cursor-pointer items-center gap-3 px-4">
      <span className="shrink-0 text-[16px] text-ink">{label}</span>
      <span className="ml-auto flex min-w-0 items-center gap-1 text-[16px] text-subtle">
        <span className="truncate">{aktuell}</span>
        <ChevronDown className="size-4 shrink-0" />
      </span>
      <select
        value={wert}
        onChange={(e) => setze(e.target.value)}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {optionen.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Zaehler({ wert, setze }: { wert: number | null; setze: (v: number | null) => void }) {
  const n = wert ?? 0;
  return (
    <div className="flex items-center overflow-hidden rounded-[8px] bg-active">
      <button
        type="button"
        onClick={() => setze(Math.max(0, n - 1))}
        aria-label="weniger"
        className="grid h-9 w-11 place-items-center text-ink hover:bg-line disabled:opacity-40"
        disabled={n <= 0}
      >
        <Minus className="size-4" strokeWidth={2.25} />
      </button>
      <input
        inputMode="numeric"
        value={wert ?? ""}
        placeholder="0"
        onChange={(e) => {
          const z = e.target.value.replace(/\D/g, "");
          setze(z === "" ? null : Number(z));
        }}
        aria-label="Anzahl bestellt"
        className="h-9 w-12 border-x border-line bg-transparent text-center text-[16px] font-semibold tabular-nums outline-none"
      />
      <button type="button" onClick={() => setze(n + 1)} aria-label="mehr" className="grid h-9 w-11 place-items-center text-ink hover:bg-line">
        <Plus className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

const hhmmText = (v: string | null) => (v ? `${v} Uhr` : undefined);

/**
 * Termin anlegen oder bearbeiten – auf eigener Seite und im Kalender.
 * `onGespeichert` bekommt den gespeicherten Termin (z. B. Blatt schließen, Kalender aktualisieren).
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
  onLaeuft,
}: {
  termin: Termin | null;
  vorlage?: Vorlage;
  gruppen: Gruppe[];
  alleTermine: Termin[];
  onGespeichert: (t: Termin) => void;
  onAbbrechen?: () => void;
  formId?: string;
  /** Knöpfe nicht anzeigen (das Blatt hat eigene) */
  ohneAktionen?: boolean;
  /** Meldet, ob gerade gespeichert wird (für Knöpfe außerhalb) */
  onLaeuft?: (laeuft: boolean) => void;
}) {
  const [w, setW] = useState<TerminEingabe>(() => (termin ? { ...termin } : leererTermin(vorlage)));
  const [fehler, setFehler] = useState<string>();
  const [adresseOffen, setAdresseOffen] = useState(() => !!(w.strasse || w.plz || w.stadt));
  const [laeuft, starte] = useTransition();
  const setze = <K extends keyof TerminEingabe>(k: K, v: TerminEingabe[K]) => setW((x) => ({ ...x, [k]: v }));
  useEffect(() => onLaeuft?.(laeuft), [laeuft, onLaeuft]);

  const vorschlaege = (f: (t: Termin) => (string | null)[]) =>
    [...new Set(alleTermine.flatMap(f).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "de"));
  const orte = useMemo(() => vorschlaege((t) => [t.treffpunkt, t.ort]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const programme = useMemo(() => vorschlaege((t) => [t.tagesprogramm]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const veranstalter = useMemo(() => vorschlaege((t) => [t.veranstalter]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const selberTag = alleTermine.filter((t) => t.datum === w.datum && t.id !== termin?.id);

  const auto = (g: Gruppe) => w.umfang !== "auswahl" && g.in_alle;
  const umschalten = (id: string) =>
    setze("gruppen", w.gruppen.includes(id) ? w.gruppen.filter((g) => g !== id) : [...w.gruppen, id]);
  const bedarf = personenBedarf({ ...(w as Termin), id: termin?.id ?? "", quelle: [] }, gruppen);

  const speichern = (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(undefined);
    if (!w.datum) return setFehler("Bitte ein Datum wählen.");
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
    <form id={formId} onSubmit={speichern} className="space-y-7">
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
        <p role="alert" className="flex items-start gap-2 rounded-[12px] bg-accent-soft p-3.5 text-[15px] text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {fehler}
        </p>
      ) : null}

      <Liste>
        <TextZeile wert={w.titel} setze={(v) => setze("titel", v ?? "")} platzhalter="Titel" gross pflicht autoFocus={!termin} />
        <ZeitZeile label="Datum" typ="date" wert={w.datum || null} setze={(v) => setze("datum", v ?? "")} anzeige={w.datum ? datumLang(w.datum) : undefined} leerText="wählen" pflicht />
      </Liste>

      <Liste titel="Treffen" fuss="Wann und wo wir uns treffen. Im Kalender steht der Termin ab der Treffzeit.">
        <ZeitZeile label="Treffzeit" typ="time" wert={w.treffzeit} setze={(v) => setze("treffzeit", v)} anzeige={hhmmText(w.treffzeit)} leerText="hinzufügen" loeschbar />
        <TextZeile label="Treffpunkt" wert={w.treffpunkt} setze={(v) => setze("treffpunkt", v)} platzhalter="z. B. Hotel zum Stern" liste="pk-orte" />
      </Liste>

      <Liste titel="Veranstaltung" fuss="Ohne Ende wird die Dauer geschätzt. Die Adresse hilft bei der Navigation und steht im Kalender-Abo.">
        <ZeitZeile label="Beginn" typ="time" wert={w.beginn} setze={(v) => setze("beginn", v)} anzeige={hhmmText(w.beginn)} leerText="hinzufügen" loeschbar />
        <ZeitZeile label="Ende" typ="time" wert={w.ende} setze={(v) => setze("ende", v)} anzeige={hhmmText(w.ende)} leerText="optional" loeschbar />
        <TextZeile label="Veranstaltungsort" wert={w.ort} setze={(v) => setze("ort", v)} platzhalter="falls anders als Treffpunkt" liste="pk-orte" />
        {adresseOffen ? (
          <>
            <TextZeile label="Straße" wert={w.strasse} setze={(v) => setze("strasse", v)} platzhalter="Straße und Hausnummer" autoComplete="street-address" />
            <label className="flex min-h-[52px] items-center gap-3 px-4">
              <span className="w-[8rem] shrink-0 text-[15px] text-subtle">PLZ</span>
              <input
                value={w.plz ?? ""}
                onChange={(e) => setze("plz", e.target.value.replace(/\D/g, "").slice(0, 5) || null)}
                placeholder="z. B. 53474"
                aria-label="Postleitzahl"
                inputMode="numeric"
                autoComplete="postal-code"
                className={cn(textfeld, "tabular-nums")}
              />
            </label>
            <TextZeile label="Stadt" wert={w.stadt} setze={(v) => setze("stadt", v)} platzhalter="z. B. Bad Neuenahr-Ahrweiler" autoComplete="address-level2" />
          </>
        ) : (
          <button type="button" onClick={() => setAdresseOffen(true)} className="flex min-h-[52px] w-full items-center gap-2 px-4 text-left text-[16px] text-accent-ink active:bg-hover">
            <Plus className="size-[18px]" />
            Adresse hinzufügen
          </button>
        )}
        <TextZeile label="Veranstalter" wert={w.veranstalter} setze={(v) => setze("veranstalter", v)} platzhalter="–" liste="pk-veranstalter" />
        {selberTag.length ? (
          <AuswahlZeile
            label="Im Anschluss an"
            wert={w.anschluss_an ?? ""}
            setze={(v) => setze("anschluss_an", v || null)}
            optionen={[{ value: "", label: "–" }, ...selberTag.map((t) => ({ value: t.id, label: t.titel }))]}
          />
        ) : null}
      </Liste>

      <Liste titel="Status">
        <Zeile label="Zusage">
          <Segmented
            value={w.status}
            onChange={(v) => setze("status", v)}
            size="sm"
            options={[
              { value: "bestaetigt", label: "bestätigt" },
              { value: "vorbehalt", label: "Vorbehalt" },
            ]}
          />
        </Zeile>
        <Zeile label="Art">
          <Segmented
            value={w.art}
            onChange={(v) => setze("art", v)}
            size="sm"
            options={[
              { value: "intern", label: "Intern" },
              { value: "extern", label: "Extern" },
            ]}
          />
        </Zeile>
      </Liste>

      <Liste
        titel="Wer ist dabei?"
        fuss={
          <>
            ca. <strong className="tabular-nums text-ink">{bedarf.summe}</strong>
            {bedarf.ohneAngabe.length ? "+" : ""} Personen
          </>
        }
      >
        <div className="px-3 py-2.5">
          <Segmented<Umfang>
            value={w.umfang}
            onChange={(v) => setze("umfang", v)}
            className="w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1"
            options={[
              { value: "alle", label: "Alle" },
              { value: "jeder_verfuegbare", label: "Jeder Verfügb." },
              { value: "auswahl", label: "Auswahl" },
            ]}
          />
        </div>
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
              className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left disabled:cursor-default"
            >
              <span className={cn("min-w-0 flex-1 truncate text-[16px]", a ? "text-subtle" : "text-ink")}>{g.name}</span>
              {g.personen != null ? <span className="text-[13px] tabular-nums text-subtle">{g.personen}</span> : null}
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full transition-colors",
                  an ? (a ? "bg-accent/45 text-white" : "bg-accent text-accent-fg") : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
                )}
              >
                {an ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}
      </Liste>

      <Liste titel="Karten / Anmeldung">
        <div className="px-3 py-2.5">
          <Segmented
            value={w.anmeldung ?? "keine"}
            onChange={(v) => setze("anmeldung", v === "keine" ? null : v)}
            className="w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1"
            options={[
              { value: "keine", label: "Nicht nötig" },
              { value: "eintrittskarte", label: "Karte", icon: <Ticket /> },
              { value: "voranmeldung", label: "Anmeldung" },
            ]}
          />
        </div>
        {w.anmeldung ? (
          <>
            <div className="flex min-h-[52px] items-center px-4">
              <span className="text-[16px]">Benötigt</span>
              <span className="ml-auto text-[16px] font-semibold tabular-nums">
                {bedarf.summe}
                {bedarf.ohneAngabe.length ? "+" : ""}
              </span>
            </div>
            <div className="flex min-h-[56px] items-center px-4">
              <span className="text-[16px]">Bestellt</span>
              <span className="ml-auto">
                <Zaehler wert={w.karten_bestellt} setze={(v) => setze("karten_bestellt", v)} />
              </span>
            </div>
          </>
        ) : null}
      </Liste>

      <Liste titel="Hinweise" fuss="Der wichtige Hinweis wird rot hervorgehoben, z. B. „Abfahrt 12:00 Uhr!“.">
        <TextZeile label="Hinweis" wert={w.hinweis} setze={(v) => setze("hinweis", v)} platzhalter="z. B. Abfahrt 12 Uhr!" />
        <div className="px-4 py-3">
          <textarea
            value={w.bemerkung ?? ""}
            onChange={(e) => setze("bemerkung", e.target.value || null)}
            placeholder="Bemerkung"
            aria-label="Bemerkung"
            rows={3}
            className={cn(textfeld, "resize-none leading-snug")}
          />
        </div>
        <TextZeile label="Noch prüfen" wert={w.pruefen} setze={(v) => setze("pruefen", v)} platzhalter="offene Frage" />
      </Liste>

      <Liste titel="Weitere Angaben" fuss="Gleiches Tagesprogramm am selben Tag fasst Termine zusammen, z. B. „Weiberdonnerstag“.">
        <TextZeile label="Programm" wert={w.tagesprogramm} setze={(v) => setze("tagesprogramm", v)} platzhalter="–" liste="pk-programme" />
      </Liste>

      {ohneAktionen ? (
        <button type="submit" hidden aria-hidden tabIndex={-1} disabled={laeuft} />
      ) : (
        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-bg/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-[var(--radius-card)] sm:border sm:px-4 sm:pb-3">
          {onAbbrechen ? (
            <Button variant="ghost" size="lg" onClick={onAbbrechen}>
              Abbrechen
            </Button>
          ) : null}
          <Button type="submit" variant="primary" size="lg" loading={laeuft} className="flex-1 sm:flex-none">
            {termin ? "Speichern" : "Termin anlegen"}
          </Button>
        </div>
      )}
    </form>
  );
}
