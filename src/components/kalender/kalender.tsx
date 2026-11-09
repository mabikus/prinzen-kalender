"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Eye,
  Keyboard,
  MapPin,
  Pencil,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  terminDuplizieren,
  terminLoeschen,
  terminSpeichern,
  terminStatusSetzen,
  terminWiederherstellen,
  terminZeitAendern,
  type Ergebnis,
  type TerminEingabe,
} from "@/app/verwaltung/aktionen";
import { GruppenBadges, KartenBadge } from "@/components/termin";
import { TerminFormular, type Vorlage } from "@/components/admin/termin-formular";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Segmented, Select } from "@/components/ui/controls";
import { Kbd } from "@/components/ui/display";
import { Dialog, useConfirm } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import { gruppeDabei, STATUS, UMFANG } from "@/lib/labels";
import type { Gruppe, Status, Termin } from "@/lib/types";
import { datumKurz, datumLang, jetztInBerlin, MONATE } from "@/lib/zeit";
import {
  blaettern,
  eintraege as zuEintraegen,
  hhmm,
  minutenAus,
  plusTage,
  tageDerAnsicht,
  verschobeneZeiten,
  type Ansicht,
  type Eintrag,
} from "./geometrie";
import { AktionenKontext, type KalenderAktionen } from "./menue";
import { useMedien } from "./medien";
import { Monatsansicht } from "./monat";
import { Zeitraster } from "./zeitraster";

interface Schritt {
  text: string;
  rueck: () => Promise<Ergebnis<unknown>>;
}

const zeitenVon = (t: Termin) => ({ datum: t.datum, treffzeit: t.treffzeit, beginn: t.beginn, ende: t.ende });

function titel(ansicht: Ansicht, tage: string[], datum: string) {
  const [j, m] = datum.split("-").map(Number);
  if (ansicht === "monat") return `${MONATE[m - 1]} ${j}`;
  if (ansicht === "tag") return datumLang(datum);
  const a = tage[0];
  const b = tage[tage.length - 1];
  const [ja, ma, da] = a.split("-").map(Number);
  const [jb, mb, db] = b.split("-").map(Number);
  return ma === mb ? `${da}.–${db}. ${MONATE[mb - 1]} ${jb}` : `${da}. ${MONATE[ma - 1]}${ja !== jb ? ` ${ja}` : ""} – ${db}. ${MONATE[mb - 1]} ${jb}`;
}

export function Kalender({
  termine: vomServer,
  gruppen,
  startAnsicht,
  startDatum,
}: {
  termine: Termin[];
  gruppen: Gruppe[];
  /** null = je nach Bildschirm (Handy: Tag, sonst Woche) */
  startAnsicht: Ansicht | null;
  startDatum: string | null;
}) {
  // Lokaler Stand (sofort sichtbar), abgeglichen mit dem Server
  const [termine, setTermine] = useState(vomServer);
  const [quelle, setQuelle] = useState(vomServer);
  if (quelle !== vomServer) {
    setQuelle(vomServer);
    setTermine(vomServer);
  }

  const [jetzt, setJetzt] = useState(() => jetztInBerlin());
  useEffect(() => {
    const t = setInterval(() => setJetzt(jetztInBerlin()), 60_000);
    return () => clearInterval(t);
  }, []);

  const handy = useMedien("(max-width: 639px)");
  const breit = useMedien("(min-width: 1024px)");
  const [gewaehlteAnsicht, setAnsicht] = useState<Ansicht | null>(startAnsicht);
  const ansicht: Ansicht = gewaehlteAnsicht ?? (handy ? "tag" : "woche");
  const [datum, setDatum] = useState(startDatum ?? jetzt.datum);
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const [fokusTag, setFokusTag] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [dialog, setDialog] = useState<{ termin: Termin | null; vorlage?: Vorlage } | null>(null);
  const [hilfe, setHilfe] = useState(false);
  const [zwischenablage, setZwischenablage] = useState<Termin | null>(null);
  const verlauf = useRef<Schritt[]>([]);
  const confirm = useConfirm();

  // Ansicht und Datum in der Adresse merken (ohne Neuladen)
  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("ansicht", ansicht);
    u.searchParams.set("datum", datum);
    window.history.replaceState(null, "", u);
  }, [ansicht, datum]);

  const tage = useMemo(() => tageDerAnsicht(ansicht, datum), [ansicht, datum]);
  const sichtbar = useMemo(() => {
    const g = gruppen.find((x) => x.id === filter);
    return g ? termine.filter((t) => gruppeDabei(t, g)) : termine;
  }, [termine, gruppen, filter]);
  const alleEintraege = useMemo(() => zuEintraegen(termine), [termine]);
  const eintraege = useMemo(() => {
    const ids = new Set(sichtbar.map((t) => t.id));
    const von = tage[0];
    const bis = tage[tage.length - 1];
    return alleEintraege.filter((e) => ids.has(e.t.id) && e.tag >= von && e.tag <= bis);
  }, [alleEintraege, sichtbar, tage]);
  const gewaehlt = termine.find((t) => t.id === auswahl) ?? null;

  const ersetze = useCallback((t: Termin) => setTermine((l) => l.map((x) => (x.id === t.id ? t : x))), []);
  const merke = (s: Schritt) => {
    verlauf.current = [...verlauf.current.slice(-49), s];
  };

  /** Änderung sofort zeigen, dann speichern; bei Fehler zurück. */
  const aendere = useCallback(
    async (alt: Termin, neu: Termin, speichern: () => Promise<Ergebnis<Termin>>, schritt: Omit<Schritt, "rueck"> & { rueck: Schritt["rueck"] }) => {
      ersetze(neu);
      const r = await speichern();
      if (!r.ok) {
        ersetze(alt);
        toast.error(r.fehler);
        return;
      }
      ersetze(r.daten);
      merke(schritt);
    },
    [ersetze],
  );

  const verschieben = useCallback(
    (e: Eintrag, minuten: number, tageDelta: number) => {
      const z = verschobeneZeiten(e.t, e.start, minuten, tageDelta);
      void aendere(e.t, { ...e.t, ...z }, () => terminZeitAendern(e.t.id, z), {
        text: `„${e.t.titel}“ verschoben`,
        rueck: () => terminZeitAendern(e.t.id, zeitenVon(e.t)),
      });
      setAuswahl(e.t.id);
    },
    [aendere],
  );

  const groesse = useCallback(
    (e: Eintrag, ende: number) => {
      const z = { ...zeitenVon(e.t), ende: hhmm(ende) };
      void aendere(e.t, { ...e.t, ende: z.ende }, () => terminZeitAendern(e.t.id, z), {
        text: `Ende von „${e.t.titel}“ geändert`,
        rueck: () => terminZeitAendern(e.t.id, zeitenVon(e.t)),
      });
    },
    [aendere],
  );

  const neu = useCallback((tag: string, start?: number, ende?: number) => {
    setDialog({
      termin: null,
      vorlage: { datum: tag, treffzeit: start != null ? hhmm(start) : null, ende: ende != null ? hhmm(ende) : null },
    });
  }, []);

  const loeschen = useCallback(
    async (t: Termin) => {
      const ok = await confirm({ title: "Termin löschen?", description: `„${t.titel}“ am ${datumKurz(t.datum)}`, confirmLabel: "Löschen", destructive: true });
      if (!ok) return;
      setTermine((l) => l.filter((x) => x.id !== t.id));
      setAuswahl(null);
      const r = await terminLoeschen(t.id);
      if (!r.ok) {
        setTermine((l) => [...l, t]);
        return void toast.error(r.fehler);
      }
      const rueck = async () => {
        const w = await terminWiederherstellen(r.daten);
        if (w.ok) setTermine((l) => [...l.filter((x) => x.id !== w.daten.id), w.daten]);
        return w;
      };
      merke({ text: `„${t.titel}“ gelöscht`, rueck });
      toast.success("Termin gelöscht", { undo: () => void rueck() });
    },
    [confirm],
  );

  const duplizieren = useCallback(async (t: Termin, tageDelta: number, zeit?: number) => {
    const r = await terminDuplizieren(t.id, plusTage(t.datum, tageDelta));
    if (!r.ok) return void toast.error(r.fehler);
    let kopie = r.daten;
    // Beim Einfügen an einer bestimmten Uhrzeit: Zeiten mitverschieben
    if (zeit != null) {
      const startAlt = minutenAus(t.treffzeit ?? t.beginn);
      if (startAlt != null && startAlt !== zeit) {
        const z = verschobeneZeiten({ ...kopie }, startAlt, zeit - startAlt, 0);
        const v = await terminZeitAendern(kopie.id, z);
        if (v.ok) kopie = v.daten;
      }
    }
    setTermine((l) => [...l, kopie]);
    setAuswahl(kopie.id);
    merke({
      text: `„${t.titel}“ dupliziert`,
      rueck: async () => {
        const d = await terminLoeschen(kopie.id);
        if (d.ok) setTermine((l) => l.filter((x) => x.id !== kopie.id));
        return d;
      },
    });
    toast.success(`Kopie am ${datumKurz(kopie.datum)} angelegt`);
  }, []);

  const status = useCallback(
    (t: Termin, s: Status) => {
      void aendere(t, { ...t, status: s }, () => terminStatusSetzen(t.id, s), {
        text: `Status von „${t.titel}“ geändert`,
        rueck: () => terminStatusSetzen(t.id, t.status),
      });
      toast.success(`Status: ${STATUS[s]}`);
    },
    [aendere],
  );

  const rueckgaengig = useCallback(async () => {
    const s = verlauf.current.pop();
    if (!s) return void toast.info("Nichts zum Rückgängigmachen");
    const r = await s.rueck();
    if (!r.ok) return void toast.error(r.fehler);
    if (r.daten && typeof r.daten === "object" && "id" in (r.daten as Termin)) ersetze(r.daten as Termin);
    toast.success(`Rückgängig: ${s.text}`);
  }, [ersetze]);

  const tagAnzeigen = useCallback((tag: string) => {
    setDatum(tag);
    setAnsicht("tag");
  }, []);

  const aktionen: KalenderAktionen = useMemo(
    () => ({
      oeffnen: (t) => setAuswahl(t.id),
      bearbeiten: (t) => setDialog({ termin: t }),
      status,
      duplizieren: (t, n) => void duplizieren(t, n),
      kopieren: (t) => {
        setZwischenablage(t);
        toast.info(`„${t.titel}“ kopiert`, "Mit Rechtsklick → Einfügen oder ⌘V an einem Tag einfügen.");
      },
      loeschen: (t) => void loeschen(t),
      neu,
      einfuegen: (tag, start) => {
        if (!zwischenablage) return;
        const diff = Math.round((Date.parse(`${tag}T12:00:00Z`) - Date.parse(`${zwischenablage.datum}T12:00:00Z`)) / 86_400_000);
        void duplizieren(zwischenablage, diff, start);
      },
      tagAnzeigen,
      zwischenablage,
    }),
    [status, duplizieren, loeschen, neu, tagAnzeigen, zwischenablage],
  );

  // ───────────── Tastatur ─────────────
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const ziel = e.target as HTMLElement;
      if (ziel.closest("input, textarea, select, [contenteditable], [role=dialog], [role=menu]")) return;
      if (dialog || hilfe) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z") {
        e.preventDefault();
        return void rueckgaengig();
      }
      if (mod && k === "c" && gewaehlt) {
        e.preventDefault();
        return aktionen.kopieren(gewaehlt);
      }
      if (mod && k === "v" && zwischenablage) {
        e.preventDefault();
        return aktionen.einfuegen(fokusTag ?? gewaehlt?.datum ?? datum, minutenAus(zwischenablage.treffzeit ?? zwischenablage.beginn) ?? undefined);
      }
      if (mod || e.altKey) return;
      if (k === "t") setDatum(jetzt.datum);
      else if (k === "arrowleft" || k === "j") setDatum((d) => blaettern(ansicht, d, -1));
      else if (k === "arrowright" || k === "k") setDatum((d) => blaettern(ansicht, d, 1));
      else if (k === "d") setAnsicht("tag");
      else if (k === "w") setAnsicht("woche");
      else if (k === "m") setAnsicht("monat");
      else if (k === "n") neu(fokusTag ?? gewaehlt?.datum ?? datum, 18 * 60, 20 * 60);
      else if ((k === "e" || k === "enter") && gewaehlt) setDialog({ termin: gewaehlt });
      else if ((k === "delete" || k === "backspace") && gewaehlt) void loeschen(gewaehlt);
      else if (k === "escape") setAuswahl(null);
      else if (k === "?") setHilfe(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [dialog, hilfe, gewaehlt, zwischenablage, fokusTag, datum, ansicht, jetzt.datum, aktionen, rueckgaengig, neu, loeschen]);

  const auswaehlen = useCallback((id: string | null, tag?: string) => {
    setAuswahl(id);
    if (tag) setFokusTag(tag);
  }, []);
  const bearbeiten = useCallback((t: Termin) => setDialog({ termin: t }), []);

  return (
    <AktionenKontext.Provider value={aktionen}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Werkzeugleiste */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-4 py-3">
          <Button variant="secondary" size="sm" onClick={() => setDatum(jetzt.datum)}>
            Heute
          </Button>
          <div className="flex">
            <Button variant="ghost" size="icon-sm" aria-label="Zurück" onClick={() => setDatum((d) => blaettern(ansicht, d, -1))}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Weiter" onClick={() => setDatum((d) => blaettern(ansicht, d, 1))}>
              <ChevronRight />
            </Button>
          </div>
          <h1 className="order-first w-full min-w-0 truncate font-display text-[18px] font-semibold text-ink sm:order-none sm:mr-auto sm:w-auto sm:text-[20px]">
            {titel(ansicht, tage, datum)}
          </h1>
          <Select
            value={filter || "alle"}
            onValueChange={(v) => setFilter(v === "alle" ? "" : v)}
            options={[{ value: "alle", label: "Alle Gruppen" }, ...gruppen.map((g) => ({ value: g.id, label: g.name }))]}
            className="hidden h-8 w-40 md:flex"
          />
          <Segmented<Ansicht>
            value={ansicht}
            onChange={setAnsicht}
            size="sm"
            label="Ansicht"
            options={[
              { value: "tag", label: "Tag" },
              { value: "woche", label: "Woche" },
              { value: "monat", label: "Monat" },
            ]}
          />
          <Button variant="ghost" size="icon-sm" aria-label="Tastenkürzel" className="hidden md:inline-flex" onClick={() => setHilfe(true)}>
            <Keyboard />
          </Button>
          <Button variant="primary" size="sm" aria-label="Neuer Termin" onClick={() => neu(fokusTag ?? datum, 18 * 60, 20 * 60)}>
            <CalendarPlus />
            <span className="hidden sm:inline">Neuer Termin</span>
          </Button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            {ansicht === "monat" ? (
              <Monatsansicht
                tage={tage}
                monat={datum.slice(0, 7)}
                eintraege={eintraege}
                heute={jetzt.datum}
                ausgewaehlt={auswahl}
                onAuswahl={auswaehlen}
                onDoppelklick={bearbeiten}
                onVerschieben={verschieben}
                onAnlegen={(tag) => neu(tag, 18 * 60, 20 * 60)}
                onTag={tagAnzeigen}
              />
            ) : (
              <Zeitraster
                tage={tage}
                eintraege={eintraege}
                heute={jetzt.datum}
                jetztMin={jetzt.minuten}
                ausgewaehlt={auswahl}
                onAuswahl={auswaehlen}
                onDoppelklick={bearbeiten}
                onVerschieben={verschieben}
                onGroesse={groesse}
                onAnlegen={neu}
                onTag={tagAnzeigen}
              />
            )}
          </div>
          {gewaehlt ? (
            <Details
              breit={breit}
              t={gewaehlt}
              gruppen={gruppen}
              alle={termine}
              schliessen={() => setAuswahl(null)}
              bearbeiten={() => setDialog({ termin: gewaehlt })}
              duplizieren={() => void duplizieren(gewaehlt, 0)}
              loeschen={() => void loeschen(gewaehlt)}
            />
          ) : null}
        </div>
      </div>

      <Dialog
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        width={760}
        title={dialog?.termin ? "Termin bearbeiten" : "Neuer Termin"}
        description={dialog?.termin ? datumLang(dialog.termin.datum) : dialog?.vorlage?.datum ? datumLang(dialog.vorlage.datum) : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Abbrechen
            </Button>
            <Button type="submit" form="kalender-termin" variant="primary">
              {dialog?.termin ? "Speichern" : "Termin anlegen"}
            </Button>
          </>
        }
      >
        {dialog ? (
          <TerminFormular
            key={dialog.termin?.id ?? `neu-${dialog.vorlage?.datum}-${dialog.vorlage?.treffzeit}`}
            formId="kalender-termin"
            ohneAktionen
            termin={dialog.termin}
            vorlage={dialog.vorlage}
            gruppen={gruppen}
            alleTermine={termine}
            onGespeichert={(t) => {
              const alt = dialog.termin;
              if (alt) {
                ersetze(t);
                merke({ text: `„${t.titel}“ geändert`, rueck: () => terminSpeichern(alt as TerminEingabe) });
              } else {
                setTermine((l) => [...l, t]);
                merke({
                  text: `„${t.titel}“ angelegt`,
                  rueck: async () => {
                    const d = await terminLoeschen(t.id);
                    if (d.ok) setTermine((l) => l.filter((x) => x.id !== t.id));
                    return d;
                  },
                });
              }
              setAuswahl(t.id);
              setDialog(null);
            }}
          />
        ) : null}
      </Dialog>

      <Dialog open={hilfe} onOpenChange={setHilfe} title="Tastenkürzel" width={520}>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5 text-[13.5px]">
          {(
            [
              ["T", "Heute"],
              ["← / →", "Zurück / weiter"],
              ["D · W · M", "Tag · Woche · Monat"],
              ["N", "Neuer Termin"],
              ["E / ↵", "Ausgewählten Termin bearbeiten"],
              ["⌫", "Ausgewählten Termin löschen"],
              ["⌘C / ⌘V", "Termin kopieren / am gewählten Tag einfügen"],
              ["⌘Z", "Letzte Änderung rückgängig"],
              ["Esc", "Auswahl aufheben"],
            ] as const
          ).map(([k, t]) => (
            <div key={k} className="contents">
              <dt>
                <Kbd>{k}</Kbd>
              </dt>
              <dd className="text-muted">{t}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 border-t border-line pt-4 text-[13px] text-subtle">
          Maus: Termin ziehen = verschieben · unten ziehen = Dauer ändern · auf freier Fläche ziehen = neuer Termin · Doppelklick =
          bearbeiten · Rechtsklick = Menü.
        </p>
      </Dialog>
    </AktionenKontext.Provider>
  );
}

function Zeile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 py-1.5 text-[13px]">
      <dt className="text-subtle">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

function Details({
  breit,
  t,
  gruppen,
  alle,
  schliessen,
  bearbeiten,
  duplizieren,
  loeschen,
}: {
  breit: boolean;
  t: Termin;
  gruppen: Gruppe[];
  alle: Termin[];
  schliessen: () => void;
  bearbeiten: () => void;
  duplizieren: () => void;
  loeschen: () => void;
}) {
  const vorher = t.anschluss_an ? alle.find((x) => x.id === t.anschluss_an) : undefined;
  // Handy/Tablet: Details als Blatt von unten statt Seitenleiste
  if (!breit)
    return (
      <Dialog
        open
        onOpenChange={(o) => !o && schliessen()}
        title={t.titel}
        description={datumLang(t.datum)}
        footer={
          <div className="grid w-full grid-cols-2 gap-2">
            <Button variant="primary" onClick={bearbeiten}>
              <Pencil />
              Bearbeiten
            </Button>
            <Button variant="secondary" onClick={duplizieren}>
              <Copy />
              Duplizieren
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/termin/${encodeURIComponent(t.id)}`}>
                <Eye />
                Ansicht
              </Link>
            </Button>
            <Button variant="danger-ghost" onClick={loeschen}>
              <Trash2 />
              Löschen
            </Button>
          </div>
        }
      >
        <DetailsInhalt t={t} gruppen={gruppen} vorher={vorher} />
      </Dialog>
    );
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
            {t.tagesprogramm ?? (t.art === "intern" ? "Intern" : "Extern")}
          </p>
          <h2 className="font-display text-[19px] font-semibold leading-snug">{t.titel}</h2>
          <p className="text-[13px] text-subtle">{datumLang(t.datum)}</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Schließen" onClick={schliessen}>
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <DetailsInhalt t={t} gruppen={gruppen} vorher={vorher} />
      </div>
      <div className={cn("grid grid-cols-2 gap-2 border-t border-line p-3")}>
        <Button variant="primary" size="sm" onClick={bearbeiten}>
          <Pencil />
          Bearbeiten
        </Button>
        <Button variant="secondary" size="sm" onClick={duplizieren}>
          <Copy />
          Duplizieren
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/termin/${encodeURIComponent(t.id)}`} target="_blank">
            <Eye />
            Ansicht
          </Link>
        </Button>
        <Button variant="danger-ghost" size="sm" onClick={loeschen}>
          <Trash2 />
          Löschen
        </Button>
      </div>
    </aside>
  );
}

function DetailsInhalt({ t, gruppen, vorher }: { t: Termin; gruppen: Gruppe[]; vorher?: Termin }) {
  return (
    <div className="space-y-4">
        {t.hinweis ? (
          <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-accent-soft p-2.5 text-[13px] font-medium text-accent-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t.hinweis}
          </p>
        ) : null}
        <dl className="divide-y divide-line">
          {t.treffzeit || t.treffpunkt ? (
            <Zeile label="Treffen">
              <strong className="tabular-nums">{t.treffzeit}</strong> {t.treffpunkt}
            </Zeile>
          ) : null}
          {vorher ? <Zeile label="Zeit">im Anschluss an „{vorher.titel}“</Zeile> : null}
          {t.beginn || t.ort ? (
            <Zeile label="Beginn">
              <strong className="tabular-nums">{t.beginn}</strong> {t.ort}
            </Zeile>
          ) : null}
          {t.ende ? <Zeile label="Ende">{t.ende}</Zeile> : null}
          {t.veranstalter ? <Zeile label="Veranstalter">{t.veranstalter}</Zeile> : null}
          <Zeile label="Status">{STATUS[t.status]}</Zeile>
          <Zeile label="Wer">
            <div className="flex flex-wrap gap-1">
              <GruppenBadges t={t} gruppen={gruppen} />
            </div>
            {t.umfang !== "auswahl" ? <span className="mt-1 block text-[12px] text-subtle">{UMFANG[t.umfang].beschreibung}</span> : null}
          </Zeile>
          {t.anmeldung ? (
            <Zeile label="Karten">
              <KartenBadge t={t} gruppen={gruppen} />
            </Zeile>
          ) : null}
          {t.bemerkung ? <Zeile label="Bemerkung">{t.bemerkung}</Zeile> : null}
        </dl>
        {t.pruefen ? (
          <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-active p-2.5 text-[12.5px] text-muted">
            <CircleHelp className="mt-0.5 size-4 shrink-0" />
            {t.pruefen}
          </p>
        ) : null}
        {t.treffpunkt && t.treffpunkt !== "im Anschluss" ? (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.treffpunkt}, Kreis Ahrweiler`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-accent-ink hover:underline"
          >
            <MapPin className="size-4" />
            Treffpunkt auf der Karte
          </a>
        ) : null}
          </div>
  );
}
