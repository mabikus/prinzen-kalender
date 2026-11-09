"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, Rss, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Termine", icon: List },
  { href: "/monat", label: "Monat", icon: CalendarDays },
  { href: "/abo", label: "Abo", icon: Rss },
  { href: "/verwaltung", label: "Verwaltung", icon: Settings, nurIcon: true },
] as const;

/** Mit Hervorhebung der aktuellen Seite */
export function Navigation() {
  return <NavLinks pfad={usePathname()} />;
}

/** Ohne aktuelle Seite – Platzhalter, solange die Adresse noch nicht bekannt ist */
export function NavLinks({ pfad }: { pfad: string | null }) {
  return (
    <nav className="flex items-center gap-0.5 text-sm">
      {NAV.map((n) => {
        const aktiv =
          pfad !== null && (n.href === "/" ? pfad === "/" || pfad.startsWith("/termin") : pfad.startsWith(n.href));
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-label={n.label}
            title={n.label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition ${
              aktiv ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {"nurIcon" in n ? null : <span className="hidden sm:inline">{n.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
