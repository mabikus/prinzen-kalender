"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BellRing, Copy, Eye, History, MoreHorizontal, Trash2 } from "lucide-react";
import { terminVerlauf } from "@/app/verwaltung/aktionen";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Switch } from "@/components/ui/controls";
import { FormularDrawer } from "@/components/ui/formular-drawer";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import type { ProtokollEintrag } from "@/lib/daten";
import { AKTION, aenderungen, zeitpunkt } from "@/lib/protokoll-text";
import type { Gruppe, Termin } from "@/lib/types";
import { datumLang } from "@/lib/zeit";
import { TerminFormular, type Vorlage } from "./termin-formular";

export interface DrawerZiel {
  termin: Termin | null;
  vorlage?: Vorlage;
}

/**
 * Das eine Bearbeitungsfenster für Termine (Liste, Kalender, direkte Links): Drawer rechts, am Handy Vollbild-Blatt.
 * Unten fest: „Mitteilen“ (Push) neben Abbrechen/Speichern – dort, wo man beim Speichern sowieso hinschaut.
 * Mit Änderungen fragt Schließen „Verwerfen?“.
 */
export function TerminDrawer({
  ziel,
  schliessen,
  gruppen,
  alleTermine,
  onGespeichert,
  onDuplizieren,
  onLoeschen,
}: {
  ziel: DrawerZiel | null;
  schliessen: () => void;
  gruppen: Gruppe[];
  alleTermine: Termin[];
  onGespeichert: (t: Termin, vorher: Termin | null) => void;
  onDuplizieren?: (t: Termin) => void;
  onLoeschen?: (t: Termin) => void;
}) {
  const offen = !!ziel;
  const [laeuft, setLaeuft] = useState(false);
  const [mitteilen, setMitteilen] = useState(false);
  const [geaendert, setGeaendert] = useState(false);
  const [geoeffnet, setGeoeffnet] = useState<DrawerZiel | null>(null);
  // Neues Ziel → Schalter und „geändert“ zurücksetzen (während des Zeichnens, ohne Aufblitzen)
  if (ziel !== geoeffnet) {
    setGeoeffnet(ziel);
    setMitteilen(false);
    setGeaendert(false);
  }
  const t = ziel?.termin ?? null;
  const formId = "termin-drawer-formular";
  const datum = t?.datum ?? ziel?.vorlage?.datum;


  return (
    <FormularDrawer
      offen={offen}
      schliessen={schliessen}
      geaendert={geaendert}
      oben={t ? (datum ? datumLang(datum) : "") : `Neuer Termin${datum ? ` · ${datumLang(datum)}` : ""}`}
      titel={t ? t.titel : "Termin anlegen"}
      kopf={
        t ? (
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Weitere Aktionen">
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem asChild>
                <Link href={`/termin/${encodeURIComponent(t.id)}`} target="_blank">
                  <Eye />
                  In der Ansicht öffnen
                </Link>
              </MenuItem>
              {onDuplizieren ? (
                <MenuItem onSelect={() => onDuplizieren(t)}>
                  <Copy />
                  Duplizieren
                </MenuItem>
              ) : null}
              {onLoeschen ? (
                <>
                  <MenuSeparator />
                  <MenuItem destructive onSelect={() => onLoeschen(t)}>
                    <Trash2 />
                    Löschen
                  </MenuItem>
                </>
              ) : null}
            </MenuContent>
          </Menu>
        ) : null
      }
      fuss={(abbrechen) => (
        <>
          <label
            className={cn(
              "flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 transition-colors",
              mitteilen ? "bg-accent-soft" : "hover:bg-hover",
            )}
          >
            <Switch checked={mitteilen} onCheckedChange={setMitteilen} aria-label={t ? "Änderung mitteilen" : "Neuen Termin mitteilen"} />
            <span className="min-w-0">
              <span className={cn("flex items-center gap-1.5 text-[14px] font-medium", mitteilen ? "text-accent-ink" : "text-ink")}>
                {mitteilen ? <BellRing className="size-4 shrink-0" /> : <Bell className="size-4 shrink-0 text-subtle" />}
                <span className="truncate">{t ? "Änderung mitteilen" : "Neuen Termin mitteilen"}</span>
              </span>
              <span className="block truncate text-[12px] text-subtle">
                {mitteilen ? (t?.vertraulich ? "Push an Freigeschaltete" : "Push an alle Geräte") : "keine Push-Mitteilung"}
              </span>
            </span>
          </label>
          <Button variant="ghost" onClick={abbrechen} className="max-sm:hidden">
            Abbrechen
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={laeuft}>
            {t ? "Speichern" : "Anlegen"}
          </Button>
        </>
      )}
    >
      {ziel ? (
        <TerminFormular
          key={t?.id ?? `neu-${ziel.vorlage?.datum}-${ziel.vorlage?.treffzeit}`}
          formId={formId}
          termin={t}
          vorlage={ziel.vorlage}
          gruppen={gruppen}
          alleTermine={alleTermine}
          mitteilen={mitteilen}
          onLaeuft={setLaeuft}
          onGeaendert={() => setGeaendert(true)}
          onGespeichert={(neu) => onGespeichert(neu, t)}
        />
      ) : null}
      {t ? <Verlauf id={t.id} /> : null}
    </FormularDrawer>
  );
}

/** Wer hat wann was geändert – lädt beim Öffnen nach */
function Verlauf({ id }: { id: string }) {
  const [eintraege, setEintraege] = useState<ProtokollEintrag[] | null>(null);
  useEffect(() => {
    let aktiv = true;
    void terminVerlauf(id).then((r) => aktiv && setEintraege(r.ok ? r.daten : []));
    return () => {
      aktiv = false;
    };
  }, [id]);
  if (!eintraege?.length) return null;
  return (
    <section className="mt-8">
      <h3 className="px-4 pb-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-subtle">Verlauf</h3>
      <ul className="divide-y divide-line overflow-hidden rounded-[12px] bg-panel shadow-[inset_0_0_0_1px_var(--line)]">
        {eintraege.map((p) => (
          <li key={p.id} className="flex gap-3 px-4 py-2.5 text-[13px]">
            <History className="mt-0.5 size-4 shrink-0 text-subtle" />
            <div className="min-w-0">
              <div>
                <strong className="font-medium">{p.benutzer_name ?? "Unbekannt"}</strong> {AKTION[p.aktion] ?? p.aktion}
                <span className="text-subtle"> · {zeitpunkt(p.zeitpunkt)}</span>
              </div>
              {aenderungen(p.details).map((z) => (
                <div key={z} className="truncate text-[12.5px] text-subtle">
                  {z}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
