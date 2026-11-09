"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronsUpDown,
  CircleUser,
  Eye,
  History,
  List,
  LogOut,
  Menu as MenuIcon,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Share2,
  Sun,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { abmelden } from "@/app/verwaltung/aktionen";
import { cn } from "@/components/ui/cn";
import { TooltipProvider, Tooltip } from "@/components/ui/controls";
import { Initials, Kbd } from "@/components/ui/display";
import { FarbschemaKnopf, FarbschemaText, farbschemaUmschalten } from "@/components/farbschema";
import { AktualisierenKnopf } from "@/components/pwa";
import { Logo as Vereinslogo } from "@/components/logo";
import { ConfirmProvider, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { Befehlspalette } from "./befehle";
import { APP_NAME } from "@/lib/marke";

export interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
}

interface NavEintrag {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: { label?: string; eintraege: NavEintrag[] }[] = [
  {
    eintraege: [
      { href: "/verwaltung/kalender", label: "Kalender", icon: CalendarDays },
      { href: "/verwaltung/termine", label: "Termine", icon: List },
      { href: "/verwaltung/gruppen", label: "Gruppen", icon: Users },
      { href: "/verwaltung/teilen", label: "Teilen", icon: Share2 },
    ],
  },
  {
    label: "Verwaltung",
    eintraege: [
      { href: "/verwaltung/benutzer", label: "Benutzer", icon: UserCog },
      { href: "/verwaltung/protokoll", label: "Protokoll", icon: History },
    ],
  },
];

// Seitenleiste ein-/ausgeklappt – im Browser gemerkt
const SCHLUESSEL = "pk-seitenleiste-schmal";
const abonnieren = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
function useSchmal(): [boolean, (v: boolean) => void] {
  const wert = useSyncExternalStore(
    abonnieren,
    () => {
      try {
        return localStorage.getItem(SCHLUESSEL) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const setzen = (v: boolean) => {
    try {
      localStorage.setItem(SCHLUESSEL, v ? "1" : "0");
      window.dispatchEvent(new StorageEvent("storage"));
    } catch {
      // ohne Speicher: nicht merken
    }
  };
  return [wert, setzen];
}

export function AdminShell({ admin, children }: { admin: AdminInfo; children: ReactNode }) {
  const [schmal, setSchmal] = useSchmal();
  const [palette, setPalette] = useState(false);
  const pfad = usePathname();
  // Menü am Handy: offen für die Seite, auf der es geöffnet wurde – nach dem Wechsel der Seite zu
  const [mobilAuf, setMobilAuf] = useState<string | null>(null);
  const mobil = mobilAuf === pfad;
  const setMobil = (v: boolean) => setMobilAuf(v ? pfad : null);
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <ConfirmProvider>
        <div className="flex h-dvh overflow-hidden bg-bg pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <a
            href="#inhalt"
            className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
          >
            Zum Inhalt springen
          </a>
          <aside
            className={cn(
              "hidden shrink-0 border-r border-line transition-[width] duration-200 md:block",
              schmal ? "w-[68px]" : "w-[248px]",
            )}
          >
            <Seitenleiste admin={admin} schmal={schmal} umschalten={() => setSchmal(!schmal)} suchen={() => setPalette(true)} />
          </aside>

          <D.Root open={mobil} onOpenChange={setMobil}>
            <D.Portal>
              <D.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
              <D.Content className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-panel shadow-[var(--shadow-pop)] outline-none md:hidden">
                <D.Title className="sr-only">Navigation</D.Title>
                <D.Description className="sr-only">Hauptnavigation der Verwaltung</D.Description>
                <Seitenleiste admin={admin} schmal={false} suchen={() => setPalette(true)} />
                <D.Close className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-subtle hover:bg-hover">
                  <X className="size-4" />
                  <span className="sr-only">Schließen</span>
                </D.Close>
              </D.Content>
            </D.Portal>
          </D.Root>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-line bg-panel px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] md:hidden">
              <button
                type="button"
                onClick={() => setMobil(true)}
                aria-label="Menü öffnen"
                className="grid size-9 place-items-center rounded-md text-muted hover:bg-hover"
              >
                <MenuIcon className="size-5" />
              </button>
              <Logo />
              <button
                type="button"
                onClick={() => setPalette(true)}
                aria-label="Suchen"
                className="ml-auto grid size-9 place-items-center rounded-md text-muted hover:bg-hover"
              >
                <Search className="size-[18px]" />
              </button>
              <AktualisierenKnopf className="size-9 rounded-md text-muted hover:bg-hover" />
              <FarbschemaKnopf className="size-9 rounded-md text-muted hover:bg-hover" />
            </div>
            <main id="inhalt" className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        <Befehlspalette offen={palette} setOffen={setPalette} />
      </ConfirmProvider>
    </TooltipProvider>
  );
}

function Logo({ nurZeichen }: { nurZeichen?: boolean }) {
  return (
    <Link href="/verwaltung/kalender" className="flex items-center gap-2.5">
      <Vereinslogo groesse={34} />
      {nurZeichen ? null : (
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-semibold text-ink">{APP_NAME}</span>
          <span className="block text-[11px] text-subtle">Verwaltung</span>
        </span>
      )}
    </Link>
  );
}

function Seitenleiste({
  admin,
  schmal,
  umschalten,
  suchen,
}: {
  admin: AdminInfo;
  schmal: boolean;
  umschalten?: () => void;
  suchen: () => void;
}) {
  const pfad = usePathname();
  return (
    <div className="flex h-full flex-col bg-panel">
      <div className={cn("flex h-14 shrink-0 items-center", schmal ? "justify-center" : "justify-between px-4")}>
        <Logo nurZeichen={schmal} />
        {umschalten && !schmal ? (
          <button
            type="button"
            onClick={umschalten}
            aria-label="Seitenleiste einklappen"
            className="grid size-8 place-items-center rounded-md text-subtle hover:bg-hover hover:text-ink"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      <div className={cn("px-3 pb-3", schmal && "px-2")}>
        {schmal ? (
          <Tooltip content="Suchen (⌘K)" side="right">
            <button
              type="button"
              onClick={suchen}
              aria-label="Suchen"
              className="grid h-9 w-full place-items-center rounded-[var(--radius-control)] text-subtle hover:bg-hover hover:text-ink"
            >
              <Search className="size-4" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={suchen}
            className="flex h-9 w-full items-center gap-2 rounded-[var(--radius-control)] bg-elevated px-3 text-[13px] text-subtle shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">Suchen …</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      <nav className={cn("min-h-0 flex-1 overflow-y-auto pb-4", schmal ? "px-2" : "px-3")} aria-label="Hauptnavigation">
        {NAV.map((g, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-5")}>
            {g.label && !schmal ? (
              <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">{g.label}</div>
            ) : null}
            {g.label && schmal ? <div className="mx-auto mb-3 h-px w-6 bg-line" /> : null}
            <ul className="flex flex-col gap-0.5">
              {g.eintraege.map((e) => (
                <li key={e.href}>
                  <NavLink eintrag={e} aktiv={pfad.startsWith(e.href)} schmal={schmal} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-5">
          {schmal ? <div className="mx-auto mb-3 h-px w-6 bg-line" /> : null}
          <NavLink eintrag={{ href: "/", label: "Ansicht öffnen", icon: Eye }} aktiv={false} schmal={schmal} />
        </div>
      </nav>

      <div className={cn("border-t border-line p-3", schmal && "p-2")}>
        <Benutzermenue admin={admin} schmal={schmal} />
        {umschalten && schmal ? (
          <button
            type="button"
            onClick={umschalten}
            aria-label="Seitenleiste ausklappen"
            className="mt-2 grid h-9 w-full place-items-center rounded-md text-subtle hover:bg-hover hover:text-ink"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function NavLink({ eintrag, aktiv, schmal }: { eintrag: NavEintrag; aktiv: boolean; schmal: boolean }) {
  const Icon = eintrag.icon;
  const link = (
    <Link
      href={eintrag.href}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--radius-control)] text-[13.5px] font-medium transition-colors",
        schmal ? "h-10 justify-center" : "h-9 px-2.5",
        aktiv ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-hover hover:text-ink",
      )}
    >
      {aktiv ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-x-[3px] -translate-y-1/2 rounded-full bg-accent" /> : null}
      <Icon className={cn("size-[18px] shrink-0", aktiv ? "text-accent-ink" : "text-subtle group-hover:text-ink")} strokeWidth={1.75} />
      {schmal ? <span className="sr-only">{eintrag.label}</span> : <span className="min-w-0 flex-1 truncate">{eintrag.label}</span>}
    </Link>
  );
  return schmal ? (
    <Tooltip content={eintrag.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function Benutzermenue({ admin, schmal }: { admin: AdminInfo; schmal: boolean }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-[var(--radius-control)] text-left hover:bg-hover",
            schmal ? "h-10 justify-center" : "h-11 px-2",
          )}
        >
          <Initials name={admin.name} color="var(--accent)" size={30} />
          {schmal ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{admin.name}</span>
                <span className="block truncate text-[12px] text-subtle">
                  {admin.role === "superadmin" ? "Super-Admin" : "Administrator"}
                </span>
              </span>
              <ChevronsUpDown className="size-4 text-subtle" />
            </>
          )}
        </button>
      </MenuTrigger>
      <MenuContent align="start" side="top" className="w-60">
        <MenuLabel className="truncate normal-case tracking-normal">{admin.email}</MenuLabel>
        <MenuItem asChild>
          <Link href="/verwaltung/konto">
            <CircleUser />
            Mein Konto
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/">
            <Eye />
            Ansicht öffnen
          </Link>
        </MenuItem>
        <MenuItem onSelect={(e) => (e.preventDefault(), farbschemaUmschalten())}>
          <Moon className="dark:hidden" />
          <Sun className="hidden dark:block" />
          <FarbschemaText />
        </MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={() => void abmelden()}>
          <LogOut />
          Abmelden
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
