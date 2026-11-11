"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { Bell, Check, ChevronDown, Lock, Minus, Plus, Ticket, TriangleAlert, X } from "lucide-react";
import { terminSpeichern, type TerminEingabe } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Segmented, Switch } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { personenBedarf } from "@/lib/labels";
import type { Gruppe, Termin, Umfang } from "@/lib/types";
import { datumLang, uhrzeitLesen } from "@/lib/zeit";

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
    personen: {},
    vertraulich: false,
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

/**
 * Uhrzeit zum Eintippen (statt der nativen Uhr-Auswahl): „1700“, „17“ oder „17.30“ wird beim Verlassen zu „17:00“.
 * Pfeil hoch/runter verstellt um 15 Minuten, Enter übernimmt. Ungültiges bleibt stehen und wird rot.
 */
function UhrzeitZeile({
  label,
  wert,
  setze,
  leerText,
  loeschbar,
}: {
  label: string;
  wert: string | null;
  setze: (v: string | null) => void;
  leerText: string;
  loeschbar?: boolean;
}) {
  // Entwurf nur während der Eingabe – sonst zeigt das Feld den gespeicherten Wert
  const [entwurf, setEntwurf] = useState<string | null>(null);
  const falsch = entwurf !== null && entwurf.trim() !== "" && uhrzeitLesen(entwurf) === null;
  const uebernehmen = () => {
    if (entwurf === null) return;
    if (entwurf.trim() === "") setze(null);
    else {
      const z = uhrzeitLesen(entwurf);
      if (!z) return;
      setze(z);
    }
    setEntwurf(null);
  };
  const schieben = (min: number) => {
    const basis = uhrzeitLesen(entwurf ?? wert ?? "") ?? "18:00";
    const [h, m] = basis.split(":").map(Number);
    const neu = (((h * 60 + m + min) % 1440) + 1440) % 1440;
    const z = `${String(Math.floor(neu / 60)).padStart(2, "0")}:${String(neu % 60).padStart(2, "0")}`;
    setEntwurf(null);
    setze(z);
  };
  return (
    <label className="flex min-h-[52px] cursor-text items-center gap-3 px-4">
      <span className="shrink-0 text-[16px] text-ink">{label}</span>
      <span
        className={cn(
          "ml-auto flex items-center rounded-[8px] px-3 py-1.5 text-[16px] tabular-nums transition-shadow",
          wert || entwurf !== null ? "bg-active" : "",
          falsch
            ? "bg-panel shadow-[inset_0_0_0_1.5px_var(--danger)]"
            : "focus-within:bg-panel focus-within:shadow-[inset_0_0_0_1.5px_var(--accent)]",
        )}
      >
        <input
          value={entwurf ?? wert ?? ""}
          onFocus={(e) => {
            setEntwurf(wert ?? "");
            e.target.select();
          }}
          onChange={(e) => setEntwurf(e.target.value.replace(/[^\d:.,h ]/gi, "").slice(0, 5))}
          onBlur={uebernehmen}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              uebernehmen();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setEntwurf(null);
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              schieben(e.key === "ArrowUp" ? 15 : -15);
            }
          }}
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          placeholder={leerText}
          aria-label={label}
          aria-invalid={falsch || undefined}
          title={falsch ? "Bitte eine Uhrzeit wie 17:30 eingeben" : undefined}
          className={cn(
            "w-[3.4rem] bg-transparent text-right font-medium text-ink outline-none placeholder:font-normal placeholder:text-subtle",
            !wert && entwurf === null && "w-[5.5rem]",
          )}
        />
        {wert || entwurf ? <span className="ml-1 text-ink">Uhr</span> : null}
      </span>
      {loeschbar && wert ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setEntwurf(null);
            setze(null);
          }}
          aria-label={`${label} leeren`}
          className="grid size-7 place-items-center rounded-full bg-active text-subtle hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </label>
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

function Zaehler({
  wert,
  setze,
  label = "Anzahl bestellt",
  platzhalter = "0",
  klein,
  hervorheben,
}: {
  wert: number | null;
  setze: (v: number | null) => void;
  label?: string;
  platzhalter?: string;
  /** kompakt für Listenzeilen (Personen je Gruppe) */
  klein?: boolean;
  /** Wert weicht vom Vorschlag ab */
  hervorheben?: boolean;
}) {
  const n = wert ?? 0;
  const knopf = cn("grid place-items-center text-ink hover:bg-line disabled:opacity-40", klein ? "h-8 w-9" : "h-9 w-11");
  return (
    <div className={cn("flex items-center overflow-hidden rounded-[8px] bg-active", hervorheben && "shadow-[inset_0_0_0_1.5px_var(--accent)]")}>
      <button type="button" onClick={() => setze(Math.max(0, n - 1))} aria-label={`${label}: weniger`} className={knopf} disabled={n <= 0}>
        <Minus className="size-4" strokeWidth={2.25} />
      </button>
      <input
        inputMode="numeric"
        value={wert ?? ""}
        placeholder={platzhalter}
        onChange={(e) => {
          const z = e.target.value.replace(/\D/g, "").slice(0, 3);
          setze(z === "" ? null : Number(z));
        }}
        onFocus={(e) => e.target.select()}
        aria-label={label}
        className={cn(
          "border-x border-line bg-transparent text-center font-semibold tabular-nums outline-none",
          klein ? "h-8 w-10 text-[15px]" : "h-9 w-12 text-[16px]",
          hervorheben && "text-accent-ink",
        )}
      />
      <button type="button" onClick={() => setze(n + 1)} aria-label={`${label}: mehr`} className={knopf}>
        <Plus className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}


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
  // Push-Mitteilung beim Speichern – bewusst aus: nicht jeder Tippfehler soll alle Handys klingeln lassen
  const [mitteilen, setMitteilen] = useState(false);
  const setze = <K extends keyof TerminEingabe>(k: K, v: TerminEingabe[K]) => setW((x) => ({ ...x, [k]: v }));
  useEffect(() => onLaeuft?.(laeuft), [laeuft, onLaeuft]);

  const vorschlaege = (f: (t: Termin) => (string | null)[]) =>
    [...new Set(alleTermine.flatMap(f).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "de"));
  const orte = useMemo(() => vorschlaege((t) => [t.treffpunkt, t.ort]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const programme = useMemo(() => vorschlaege((t) => [t.tagesprogramm]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const veranstalter = useMemo(() => vorschlaege((t) => [t.veranstalter]), [alleTermine]); // eslint-disable-line react-hooks/exhaustive-deps
  const selberTag = alleTermine.filter((t) => t.datum === w.datum && t.id !== termin?.id);

  const auto = (g: Gruppe) => w.umfang !== "auswahl" && g.in_alle;
  const setzePersonen = (g: Gruppe, v: number | null) => {
    const neu = { ...w.personen };
    if (v === null || v === g.personen) delete neu[g.id];
    else neu[g.id] = v;
    setze("personen", neu);
  };
  const umschalten = (id: string) =>
    setze("gruppen", w.gruppen.includes(id) ? w.gruppen.filter((g) => g !== id) : [...w.gruppen, id]);
  const bedarf = personenBedarf({ ...(w as Termin), id: termin?.id ?? "", quelle: [] }, gruppen);

  const speichern = (e: React.FormEvent) => {
    e.preventDefault();
    setFehler(undefined);
    if (!w.datum) return setFehler("Bitte ein Datum wählen.");
    // Bei "Alle" nur die Extras speichern (z. B. Familie)
    const eingabe: TerminEingabe = {
      ...w,
      id: termin?.id,
      gruppen: w.umfang === "auswahl" ? w.gruppen : w.gruppen.filter((id) => !gruppen.find((g) => g.id === id)?.in_alle),
    };
    starte(async () => {
      const r = await terminSpeichern(eingabe, mitteilen);
      if (!r.ok) {
        setFehler(r.fehler);
        return;
      }
      const n = r.daten.mitgeteilt;
      toast.success(termin ? "Termin gespeichert" : "Termin angelegt", {
        description:
          n === undefined
            ? undefined
            : n === 0
              ? r.daten.vertraulich
                ? "Kein mit PIN freigeschaltetes Gerät hat Mitteilungen eingeschaltet."
                : "Noch hat kein Gerät Mitteilungen eingeschaltet."
              : `Mitteilung an ${n} ${n === 1 ? "Gerät" : "Geräte"} verschickt.`,
      });
      setMitteilen(false);
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
        <UhrzeitZeile label="Treffzeit" wert={w.treffzeit} setze={(v) => setze("treffzeit", v)} leerText="hinzufügen" loeschbar />
        <TextZeile label="Treffpunkt" wert={w.treffpunkt} setze={(v) => setze("treffpunkt", v)} platzhalter="z. B. Hotel zum Stern" liste="pk-orte" />
      </Liste>

      <Liste titel="Veranstaltung" fuss="Ohne Ende wird die Dauer geschätzt. Die Adresse hilft bei der Navigation und steht im Kalender-Abo.">
        <UhrzeitZeile label="Beginn" wert={w.beginn} setze={(v) => setze("beginn", v)} leerText="hinzufügen" loeschbar />
        <UhrzeitZeile label="Ende" wert={w.ende} setze={(v) => setze("ende", v)} leerText="optional" loeschbar />
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

      <Liste
        titel="Status"
        fuss={
          w.vertraulich
            ? "Vertraulich: erscheint nur, wer in der App unter Einstellungen die PIN eingegeben hat (PIN: Verwaltung → Einstellungen → Vertrauliche Termine)."
            : undefined
        }
      >
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
        <Zeile label="Sichtbar für">
          <Segmented
            value={w.vertraulich ? "pin" : "alle"}
            onChange={(v) => setze("vertraulich", v === "pin")}
            size="sm"
            options={[
              { value: "alle", label: "Alle" },
              { value: "pin", label: "Nur mit PIN", icon: <Lock /> },
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
              { value: "auswahl", label: "Auswahl" },
            ]}
          />
        </div>
        {gruppen.map((g) => {
          const a = auto(g);
          const an = a || w.gruppen.includes(g.id);
          const eigen = w.personen[g.id];
          const gesetzt = typeof eigen === "number";
          // „statt …“ nur, wenn die Gruppe überhaupt eine Zahl hat – sonst ist es einfach die Angabe für diesen Termin
          const abweichend = gesetzt && g.personen != null && eigen !== g.personen;
          return (
            <div key={g.id} className="flex min-h-[48px] items-center gap-3 pr-4">
              <button
                type="button"
                role="checkbox"
                aria-checked={an}
                disabled={a}
                onClick={() => umschalten(g.id)}
                className="flex min-h-[48px] min-w-0 flex-1 items-center pl-4 text-left disabled:cursor-default"
              >
                <span className={cn("min-w-0 flex-1 truncate text-[16px]", an ? "text-ink" : "text-muted")}>{g.name}</span>
              </button>
              {an ? (
                // Vorschlag ist die Zahl der Gruppe – je Termin änderbar (z. B. „vom Elferrat nur 2“)
                <span className="flex items-center gap-1.5">
                  {abweichend ? (
                    <button
                      type="button"
                      onClick={() => setzePersonen(g, null)}
                      title={`Zurück auf ${g.personen ?? "keine Angabe"} (Zahl der Gruppe)`}
                      className="rounded-md px-1.5 py-1 text-[12px] text-subtle hover:bg-hover hover:text-ink"
                    >
                      statt {g.personen ?? "–"}
                    </button>
                  ) : null}
                  <Zaehler
                    klein
                    wert={gesetzt ? eigen : g.personen}
                    platzhalter="?"
                    setze={(v) => setzePersonen(g, v)}
                    label={`Personen ${g.name}`}
                    hervorheben={abweichend}
                  />
                </span>
              ) : g.personen != null ? (
                <span className="text-[13px] tabular-nums text-subtle">{g.personen}</span>
              ) : null}
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                disabled={a}
                onClick={() => umschalten(g.id)}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-default",
                  an ? (a ? "bg-accent/45 text-white" : "bg-accent text-accent-fg") : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
                )}
              >
                {an ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </button>
            </div>
          );
        })}
      </Liste>

      <Liste titel="Karten">
        <div className="px-3 py-2.5">
          <Segmented
            value={w.anmeldung ?? "keine"}
            onChange={(v) => setze("anmeldung", v === "keine" ? null : v)}
            className="w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1"
            options={[
              { value: "keine", label: "Nicht nötig" },
              { value: "eintrittskarte", label: "Karte", icon: <Ticket /> },
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

      <Liste
        titel="Mitteilung"
        fuss={
          mitteilen
            ? w.vertraulich
              ? "Geht beim Speichern nur an Geräte, die mit der PIN freigeschaltet sind."
              : "Geht beim Speichern als Push-Mitteilung an alle Geräte mit eingeschalteten Mitteilungen – mit dem, was sich geändert hat."
            : "Aus: Es geht keine Mitteilung raus (z. B. bei Tippfehlern)."
        }
      >
        <label className="flex min-h-[52px] cursor-pointer items-center gap-3 px-4">
          <Bell className="size-[18px] shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 text-[16px] text-ink">{termin ? "Änderung mitteilen" : "Neuen Termin mitteilen"}</span>
          <Switch checked={mitteilen} onCheckedChange={setMitteilen} aria-label={termin ? "Änderung mitteilen" : "Neuen Termin mitteilen"} />
        </label>
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
