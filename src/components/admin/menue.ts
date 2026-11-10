import {
  CalendarDays,
  History,
  List,
  Palette,
  Settings,
  Share2,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

// Eigene Datei (ohne "use client"), damit auch Server-Seiten wie die Einstellungs-Übersicht die Listen lesen können.

export interface NavEintrag {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Kurzbeschreibung (Zahnrad-Menü, Einstellungs-Übersicht) */
  text?: string;
}

/** Hauptmenü: die tägliche Arbeit */
export const HAUPT: NavEintrag[] = [
  { href: "/verwaltung/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/verwaltung/termine", label: "Termine", icon: List },
  { href: "/verwaltung/gruppen", label: "Gruppen", icon: Users },
  { href: "/verwaltung/teilen", label: "Teilen", icon: Share2 },
];

/** Hinter dem Zahnrad: selten gebraucht – unter diesen Pfaden zeigt die Leiste das Einstellungs-Menü */
export const EINSTELLUNGEN: NavEintrag[] = [
  { href: "/verwaltung/darstellung", label: "Darstellung", icon: Palette, text: "App-Name, Unterzeile und Logo" },
  { href: "/verwaltung/benutzer", label: "Benutzer", icon: UserCog, text: "Wer die Verwaltung bedienen darf" },
  { href: "/verwaltung/protokoll", label: "Protokoll", icon: History, text: "Wer wann was geändert hat" },
  { href: "/verwaltung/konto", label: "Mein Konto", icon: UserRound, text: "Name, Passwort und Passkeys" },
];

/** Für die Befehlspalette */
export const NAV: { label?: string; eintraege: NavEintrag[] }[] = [
  { eintraege: HAUPT },
  { label: "Einstellungen", eintraege: [{ href: "/verwaltung/einstellungen", label: "Einstellungen", icon: Settings }, ...EINSTELLUNGEN] },
];

