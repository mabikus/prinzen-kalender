"use client";

import { createContext, useContext, type ReactElement } from "react";
import {
  CalendarPlus,
  CircleCheck,
  ClipboardPaste,
  Clock,
  Copy,
  CopyPlus,
  Eye,
  PanelRightOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Status, Termin } from "@/lib/types";
import { datumKurz } from "@/lib/zeit";
import { hhmm } from "./geometrie";

/** Aktionen, die der Kalender den Rechtsklick-Menüs bereitstellt */
export interface KalenderAktionen {
  oeffnen: (t: Termin) => void;
  bearbeiten: (t: Termin) => void;
  status: (t: Termin, s: Status) => void;
  duplizieren: (t: Termin, tage: number) => void;
  kopieren: (t: Termin) => void;
  loeschen: (t: Termin) => void;
  neu: (tag: string, start?: number, ende?: number) => void;
  einfuegen: (tag: string, start?: number) => void;
  tagAnzeigen: (tag: string) => void;
  zwischenablage: Termin | null;
}

export const AktionenKontext = createContext<KalenderAktionen | null>(null);

/** Rechtsklick auf einen Termin */
export function TerminMenue({ termin, children }: { termin: Termin; children: ReactElement }) {
  const k = useContext(AktionenKontext);
  if (!k) return children;
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuLabel className="truncate normal-case tracking-normal text-[12px]">
          {termin.titel} · {datumKurz(termin.datum)}
        </ContextMenuLabel>
        <ContextMenuItem onSelect={() => k.oeffnen(termin)}>
          <PanelRightOpen />
          Details
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => k.bearbeiten(termin)}>
          <Pencil />
          Bearbeiten
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {termin.status === "vorbehalt" ? <Clock /> : <CircleCheck />}
            Status
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuRadioGroup value={termin.status} onValueChange={(v) => v !== termin.status && k.status(termin, v as Status)}>
              <ContextMenuRadioItem value="bestaetigt">bestätigt</ContextMenuRadioItem>
              <ContextMenuRadioItem value="vorbehalt">unter Vorbehalt</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => k.kopieren(termin)}>
          <Copy />
          Kopieren
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CopyPlus />
            Duplizieren
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52">
            <ContextMenuItem onSelect={() => k.duplizieren(termin, 0)}>am selben Tag</ContextMenuItem>
            <ContextMenuItem onSelect={() => k.duplizieren(termin, 1)}>am nächsten Tag</ContextMenuItem>
            <ContextMenuItem onSelect={() => k.duplizieren(termin, 7)}>eine Woche später</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onSelect={() => window.open(`/termin/${encodeURIComponent(termin.id)}`, "_blank")}>
          <Eye />
          In der Ansicht öffnen
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive onSelect={() => k.loeschen(termin)}>
          <Trash2 />
          Löschen
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Rechtsklick auf eine freie Stelle. `wo()` liefert Tag und Uhrzeit der Klickstelle
 * (wird beim Öffnen gelesen, damit "Neuer Termin um …" die richtige Zeit zeigt).
 */
export function FlaecheMenue({
  tag,
  start,
  children,
}: {
  tag: string;
  start?: number;
  children: ReactElement;
}) {
  const k = useContext(AktionenKontext);
  if (!k) return children;
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        <ContextMenuLabel className="normal-case tracking-normal text-[12px]">
          {datumKurz(tag)}
          {start != null ? ` · ${hhmm(start)}` : ""}
        </ContextMenuLabel>
        <ContextMenuItem onSelect={() => k.neu(tag, start, start != null ? start + 120 : undefined)}>
          <CalendarPlus />
          Neuer Termin{start != null ? ` um ${hhmm(start)}` : ""}
          <ContextMenuShortcut>N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!k.zwischenablage} onSelect={() => k.einfuegen(tag, start)}>
          <ClipboardPaste />
          {k.zwischenablage ? `„${k.zwischenablage.titel}“ einfügen` : "Einfügen"}
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => k.tagAnzeigen(tag)}>
          <Eye />
          Tag anzeigen
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
