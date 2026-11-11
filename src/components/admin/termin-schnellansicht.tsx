"use client";

import Link from "next/link";
import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";
import {
  CircleHelp,
  Clock,
  Copy,
  ExternalLink,
  Flag,
  Lock,
  MapPin,
  MoreHorizontal,
  Navigation,
  Pencil,
  Ticket,
  Trash2,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Badge } from "@/components/ui/display";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { adresseText, kartenLink } from "@/lib/adresse";
import { ART, personenBedarf, personenVon, UMFANG, werText } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { startzeit, zeitplan, zeitText } from "@/lib/zeit";

// Schnellansicht eines Termins im Stil der KBN-Schnellansicht: großer Titel, Eckdaten-Kacheln, darunter ruhige Karten.
// Angedockt im Kalender (Panel), sonst als Drawer rechts bzw. Blatt am Handy. Bearbeiten öffnet den Termin-Drawer.

const MITTEL = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
/** „Fr., 13. Nov. 2026“ – passt auch in die schmale Leiste */
const datumMittel = (d: string) => MITTEL.format(new Date(`${d}T12:00:00Z`));

export interface SchnellAktionen {
  bearbeiten: (t: Termin) => void;
  duplizieren?: (t: Termin) => void;
  loeschen?: (t: Termin) => void;
}

function Kachel({ icon: Icon, label, wert, unter, ton }: { icon: LucideIcon; label: string; wert: ReactNode; unter?: ReactNode; ton?: "akzent" }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[14px] bg-panel p-3 shadow-[var(--shadow-card)]">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-[10px]",
          ton === "akzent" ? "bg-accent text-accent-fg" : "bg-accent-soft text-accent-ink",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-subtle">{label}</div>
        <div className="line-clamp-2 text-[14.5px] font-semibold leading-tight text-ink">{wert}</div>
        {unter ? <div className="line-clamp-2 text-[12px] leading-snug text-subtle">{unter}</div> : null}
      </div>
    </div>
  );
}

function Karte({ titel, aktion, children }: { titel: string; aktion?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[14px] bg-panel p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-ink">{titel}</h3>
        {aktion}
      </div>
      {children}
    </section>
  );
}

function Zeile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 text-[13.5px] last:border-0 last:pb-0">
      <span className="shrink-0 text-subtle">{label}</span>
      <span className="min-w-0 text-right text-ink">{children}</span>
    </div>
  );
}

function OrtZeile({ icon: Icon, label, name, zeit, adresse }: { icon: LucideIcon; label: string; name: string; zeit?: string | null; adresse?: string | null }) {
  const link = name !== "im Anschluss";
  return (
    <div className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-accent-ink" />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-subtle">
          {label}
          {zeit ? <span className="font-medium text-ink"> · {zeit} Uhr</span> : null}
        </div>
        <div className="text-[14px] font-medium text-ink">{name}</div>
        {adresse && adresse !== name ? <div className="text-[13px] text-subtle">{adresse}</div> : null}
      </div>
      {link ? (
        <a
          href={kartenLink(name, adresse)}
          target="_blank"
          rel="noreferrer"
          aria-label={`${name} auf der Karte`}
          className="grid size-8 shrink-0 place-items-center rounded-md text-subtle hover:bg-hover hover:text-accent-ink"
        >
          <Navigation className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

/** Kopf + Inhalt; `schliessen` zeigt das X */
export function SchnellansichtInhalt({
  t,
  gruppen,
  alle,
  aktionen,
  schliessen,
}: {
  t: Termin;
  gruppen: Gruppe[];
  alle: Termin[];
  aktionen: SchnellAktionen;
  schliessen: () => void;
}) {
  const z = zeitplan(alle).get(t.id);
  const vorher = t.anschluss_an ? alle.find((x) => x.id === t.anschluss_an) : undefined;
  const adresse = adresseText(t);
  const venue = (t.ort && t.ort !== t.treffpunkt) || adresse ? (t.ort ?? t.treffpunkt ?? adresse!) : null;
  const bedarf = personenBedarf(t, gruppen);
  const fehlen = t.anmeldung ? Math.max(0, bedarf.summe - (t.karten_bestellt ?? 0)) : 0;
  const start = startzeit(t);
  const bis = z?.ende != null ? `${t.ende ? "" : "ca. "}${zeitText(z.ende)}` : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line bg-panel px-5 pb-4 pt-3">
        <div className="flex items-center gap-1">
          <D.Description asChild>
            <p className="min-w-0 flex-1 truncate text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink">
              {datumMittel(t.datum)}
              {t.tagesprogramm ? ` · ${t.tagesprogramm}` : ""}
            </p>
          </D.Description>
          <Button variant="primary" size="sm" onClick={() => aktionen.bearbeiten(t)} className="mr-1">
            <Pencil />
            Bearbeiten
          </Button>
          {aktionen.duplizieren || aktionen.loeschen ? (
            <Menu>
              <MenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Weitere Aktionen">
                  <MoreHorizontal />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuItem asChild>
                  <Link href={`/termin/${encodeURIComponent(t.id)}`} target="_blank">
                    <ExternalLink />
                    In der Ansicht öffnen
                  </Link>
                </MenuItem>
                {aktionen.duplizieren ? (
                  <MenuItem onSelect={() => aktionen.duplizieren!(t)}>
                    <Copy />
                    Duplizieren
                  </MenuItem>
                ) : null}
                {aktionen.loeschen ? (
                  <>
                    <MenuSeparator />
                    <MenuItem destructive onSelect={() => aktionen.loeschen!(t)}>
                      <Trash2 />
                      Löschen
                    </MenuItem>
                  </>
                ) : null}
              </MenuContent>
            </Menu>
          ) : null}
          <Button variant="ghost" size="icon-sm" aria-label="Schließen" onClick={schliessen}>
            <X />
          </Button>
        </div>
        <D.Title asChild>
          <h2 className="mt-1.5 font-display text-[24px] font-bold leading-tight tracking-[-0.015em] text-ink [hyphens:auto] [overflow-wrap:anywhere]" lang="de">
            {t.titel}
          </h2>
        </D.Title>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge>{ART[t.art]}</Badge>
          {t.vertraulich ? (
            <Badge tone="accent">
              <Lock className="size-3" />
              Vertraulich
            </Badge>
          ) : null}
          <Badge tone={t.status === "vorbehalt" ? "warning" : "success"}>{t.status === "vorbehalt" ? "Vorbehalt" : "bestätigt"}</Badge>
          {t.pruefen ? <Badge tone="info">Prüfen</Badge> : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-bg p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-3">
          <Kachel
            icon={Clock}
            label={t.treffzeit ? "Treffen" : t.beginn ? "Beginn" : "Zeit"}
            wert={start ? `${start} Uhr` : vorher ? "im Anschluss" : "offen"}
            unter={[t.treffzeit && t.beginn && t.treffzeit !== t.beginn ? `Beginn ${t.beginn}` : null, bis ? `bis ${bis}` : null].filter(Boolean).join(" · ") || undefined}
          />
          <Kachel
            icon={MapPin}
            label={t.treffpunkt ? "Treffpunkt" : "Ort"}
            wert={t.treffpunkt ?? venue ?? "–"}
            unter={t.treffpunkt && venue && venue !== t.treffpunkt ? venue : undefined}
          />
          <Kachel icon={Users} label="Wer" wert={werText(t, gruppen)} unter={`ca. ${bedarf.summe}${bedarf.ohneAngabe.length ? "+" : ""} Personen`} />
          <Kachel
            icon={Ticket}
            label="Karten"
            wert={t.anmeldung ? `${t.karten_bestellt ?? 0} von ${bedarf.summe}${bedarf.ohneAngabe.length ? "+" : ""}` : "nicht nötig"}
            unter={t.anmeldung ? (fehlen ? `${fehlen} fehlen noch` : "alle bestellt") : undefined}
            ton={t.anmeldung && fehlen ? "akzent" : undefined}
          />
        </div>

        {t.hinweis ? (
          <p className="flex items-start gap-2.5 rounded-[14px] bg-accent-soft p-3.5 text-[13.5px] font-medium text-accent-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {t.hinweis}
          </p>
        ) : null}

        {t.treffpunkt || venue || vorher ? (
          <Karte titel="Orte">
            <div className="divide-y divide-line">
              {vorher ? <OrtZeile icon={Clock} label="Zeit" name="im Anschluss" adresse={`an „${vorher.titel}“`} /> : null}
              {t.treffpunkt ? <OrtZeile icon={MapPin} label="Treffpunkt" name={t.treffpunkt} zeit={t.treffzeit} /> : null}
              {venue ? <OrtZeile icon={Flag} label="Veranstaltungsort" name={venue} zeit={t.beginn} adresse={adresse} /> : null}
            </div>
          </Karte>
        ) : null}

        <Karte titel="Wer ist dabei?" aktion={<span className="text-[12.5px] text-subtle tabular">ca. {bedarf.summe}{bedarf.ohneAngabe.length ? "+" : ""} Pers.</span>}>
          {t.umfang !== "auswahl" ? <p className="mb-1.5 text-[12.5px] text-subtle">{UMFANG[t.umfang].beschreibung}</p> : null}
          <div>
            {bedarf.dabei.length ? (
              bedarf.dabei.map((g) => {
                const n = personenVon(t, g);
                const abweichend = typeof t.personen?.[g.id] === "number" && g.personen != null && t.personen[g.id] !== g.personen;
                return (
                  <Zeile key={g.id} label={g.name}>
                    {n == null ? (
                      <span className="text-accent-ink">Anzahl fehlt</span>
                    ) : (
                      <span className="tabular">
                        {n}
                        {abweichend ? <span className="ml-1 text-[12px] text-subtle">(statt {g.personen})</span> : null}
                      </span>
                    )}
                  </Zeile>
                );
              })
            ) : (
              <p className="text-[13.5px] text-subtle">Noch keine Gruppe ausgewählt.</p>
            )}
          </div>
        </Karte>

        <Karte titel="Details">
          <div>
            <Zeile label="Veranstalter">{t.veranstalter ?? "–"}</Zeile>
            <Zeile label="Zusage">{t.status === "vorbehalt" ? "unter Vorbehalt" : "bestätigt"}</Zeile>
            <Zeile label="Sichtbar für">{t.vertraulich ? "nur mit PIN" : "alle"}</Zeile>
            {t.bemerkung ? <Zeile label="Bemerkung">{t.bemerkung}</Zeile> : null}
          </div>
          {t.pruefen ? (
            <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-active p-2.5 text-[12.5px] text-muted">
              <CircleHelp className="mt-0.5 size-4 shrink-0" />
              {t.pruefen}
            </p>
          ) : null}
        </Karte>
      </div>
    </div>
  );
}

/** Als Drawer rechts (PC/Tablet) bzw. Blatt von unten (Handy) – für Liste und Kalender am Handy */
export function SchnellansichtDrawer({
  t,
  gruppen,
  alle,
  aktionen,
  schliessen,
}: {
  t: Termin | null;
  gruppen: Gruppe[];
  alle: Termin[];
  aktionen: SchnellAktionen;
  schliessen: () => void;
}) {
  return (
    <D.Root open={!!t} onOpenChange={(o) => !o && schliessen()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-bg shadow-[var(--shadow-pop)] outline-none",
            "inset-x-0 bottom-0 top-[max(env(safe-area-inset-top),2.5rem)] rounded-t-[18px] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=open]:duration-300",
            "sm:inset-x-auto sm:bottom-2 sm:right-2 sm:top-2 sm:w-[min(620px,calc(100vw-1rem))] sm:rounded-[18px] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-right-10",
          )}
        >
          {t ? <SchnellansichtInhalt t={t} gruppen={gruppen} alle={alle} aktionen={aktionen} schliessen={schliessen} /> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/**
 * Im Kalender (PC): schwebt über dem Kalender rechts – schiebt ihn nicht weg. Nicht modal: Ein Klick auf einen
 * anderen Termin wechselt die Ansicht, Esc oder × schließt.
 */
export function SchnellansichtPanel(props: { t: Termin; gruppen: Gruppe[]; alle: Termin[]; aktionen: SchnellAktionen; schliessen: () => void }) {
  return (
    <D.Root open modal={false} onOpenChange={(o) => !o && props.schliessen()}>
      <D.Portal>
        <D.Content
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed bottom-2 right-2 top-[60px] z-30 flex w-[clamp(460px,28vw,620px)] flex-col overflow-hidden rounded-[18px] bg-bg shadow-[0_24px_60px_-16px_rgb(0_0_0/0.35),0_0_0_1px_var(--line)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-6"
        >
          <SchnellansichtInhalt {...props} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
