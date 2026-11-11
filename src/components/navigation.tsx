"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, Rss, Settings } from "lucide-react";

const NAV = [
  { href: "/", label: "Termine", icon: List },
  { href: "/monat", label: "Monat", icon: CalendarDays },
  { href: "/abo", label: "Abo", icon: Rss },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
] as const;

type Variante = "oben" | "unten";

/** Mit Hervorhebung der aktuellen Seite */
export function Navigation({ variante }: { variante: Variante }) {
  return <NavLinks pfad={usePathname()} variante={variante} />;
}

function istAktiv(pfad: string | null, href: string) {
  if (pfad === null) return false;
  return href === "/" ? pfad === "/" || pfad.startsWith("/termin") : pfad.startsWith(href);
}

/**
 * oben: Kopfzeile am Tablet/PC · unten: Tab-Leiste am Handy (wie eine App, über der Home-Leiste).
 * Ohne `pfad` (Platzhalter beim Laden) ist nichts hervorgehoben.
 */
export function NavLinks({ pfad, variante }: { pfad: string | null; variante: Variante }) {
  if (variante === "unten")
    return (
      // Schwebende Glas-Leiste wie bei iOS – der Inhalt läuft darunter durch
      <nav
        aria-label="Hauptnavigation"
        className="glas fixed inset-x-4 bottom-[var(--tab-unten)] z-30 mx-auto max-w-md rounded-full p-1 sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV.map((n) => {
            const aktiv = istAktiv(pfad, n.href);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                {/* Nur Symbole (wie bei Instagram) – die Beschriftung lesen Screenreader trotzdem vor */}
                <Link
                  href={n.href}
                  prefetch
                  transitionTypes={["tab"]}
                  aria-current={aktiv ? "page" : undefined}
                  aria-label={n.label}
                  title={n.label}
                  className={`flex h-12 items-center justify-center rounded-full transition-colors active:scale-95 ${
                    aktiv ? "bg-[var(--glas-aktiv)] text-marke-700" : "text-tinte/75"
                  }`}
                >
                  <Icon className="size-[25px]" strokeWidth={aktiv ? 2.1 : 1.6} aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );

  return (
    <nav aria-label="Hauptnavigation" className="hidden items-center gap-0.5 text-[15px] sm:flex">
      {NAV.map((n) => {
        const aktiv = istAktiv(pfad, n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            prefetch
            transitionTypes={["tab"]}
            aria-current={aktiv ? "page" : undefined}
            title={n.label}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
              aktiv ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            {n.href === "/einstellungen" ? <span className="sr-only">{n.label}</span> : n.label}
          </Link>
        );
      })}
    </nav>
  );
}
