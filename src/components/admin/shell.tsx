"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { useEffect, useState, useSyncExternalStore, type ReactNode, createContext, useContext } from "react";
import {
  ChevronLeft,
  Eye,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { abmelden } from "@/app/verwaltung/aktionen";
import { cn } from "@/components/ui/cn";
import { Segmented, TooltipProvider, Tooltip } from "@/components/ui/controls";
import { Initials, Kbd } from "@/components/ui/display";
import { FarbschemaKnopf, farbschemaUmschalten } from "@/components/farbschema";
import { AktualisierenKnopf } from "@/components/pwa";
import { ConfirmProvider, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/overlay";
import { Befehlspalette } from "./befehle";
import { EINSTELLUNGEN, HAUPT, type NavEintrag } from "./menue";
import { APP_NAME } from "@/lib/marke";

export interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
}

const istAktiv = (pfad: string, href: string) => pfad === href || pfad.startsWith(href + "/");
const inEinstellungen = (pfad: string) => istAktiv(pfad, "/verwaltung/einstellungen") || EINSTELLUNGEN.some((e) => istAktiv(pfad, e.href));

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

/** Name und Logo-Stand der App (Verwaltung → Darstellung) für Logo und Kopf */
export interface MarkeInfo {
  name: string;
  logoStand: number;
}
const MarkeKontext = createContext<MarkeInfo>({ name: APP_NAME, logoStand: 0 });

export function AdminShell({ admin, marke, children }: { admin: AdminInfo; marke: MarkeInfo; children: ReactNode }) {
  return (
    <MarkeKontext.Provider value={marke}>
      <Rahmen admin={admin}>{children}</Rahmen>
    </MarkeKontext.Provider>
  );
}

function Rahmen({ admin, children }: { admin: AdminInfo; children: ReactNode }) {
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
        <div data-verwaltung className="flex h-dvh overflow-hidden bg-bg pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <a
            href="#inhalt"
            className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
          >
            Zum Inhalt springen
          </a>
          <aside
            className={cn(
              "hidden shrink-0 border-r border-line transition-[width] duration-200 md:block",
              schmal ? "w-[68px]" : "w-[260px]",
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
                <Seitenleiste admin={admin} schmal={false} suchen={() => setPalette(true)} imBlatt />
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
              <Link href="/verwaltung/kalender" className="flex min-w-0 items-center gap-2.5">
                <LogoKachel groesse={30} />
                <MarkeKopf />
              </Link>
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

/** Vereinslogo als Kachel wie das Firmenlogo in KBN */
function LogoKachel({ groesse }: { groesse: number }) {
  const marke = useContext(MarkeKontext);
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-[9px] bg-white ring-1 ring-line"
      style={{ width: groesse, height: groesse }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamisches Logo aus der Verwaltung */}
      <img src={`/marke/logo?klein=1&v=${marke.logoStand}`} alt="" className="max-h-[86%] max-w-[86%] object-contain" decoding="async" />
    </span>
  );
}

function Logo({ nurZeichen }: { nurZeichen?: boolean }) {
  const marke = useContext(MarkeKontext);
  return (
    <Link
      href="/verwaltung/kalender"
      aria-label={nurZeichen ? `${marke.name} – Kalender` : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-control)] text-left hover:bg-hover",
        nurZeichen ? "h-10 justify-center" : "h-12 px-2",
      )}
    >
      <LogoKachel groesse={nurZeichen ? 30 : 34} />
      {nurZeichen ? null : (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{marke.name}</span>
          <span className="block truncate text-[12px] text-subtle">Verwaltung</span>
        </span>
      )}
    </Link>
  );
}

/** Seitenleiste wie KBN: oben Logo und Suche, Mitte das Menü, unten Person und Zahnrad. Unter den Einstellungen
 *  zeigt sie deren Bereiche statt des Hauptmenüs – so findet man zurück, ohne zu suchen. */
function Seitenleiste({
  admin,
  schmal,
  umschalten,
  suchen,
  imBlatt,
}: {
  admin: AdminInfo;
  schmal: boolean;
  umschalten?: () => void;
  suchen: () => void;
  imBlatt?: boolean;
}) {
  const pfad = usePathname();
  const einstellungen = inEinstellungen(pfad);
  return (
    <div className="flex h-full flex-col bg-panel">
      <div className={cn("flex shrink-0 items-center gap-1 pt-3", schmal ? "flex-col px-2" : "px-3", imBlatt && "pr-12")}>
        <div className="min-w-0 flex-1 self-stretch">
          <Logo nurZeichen={schmal} />
        </div>
        {umschalten && !schmal ? (
          <Tooltip content="Seitenleiste einklappen" side="right">
            <button
              type="button"
              onClick={umschalten}
              aria-label="Seitenleiste einklappen"
              className="grid size-8 shrink-0 place-items-center rounded-md text-subtle hover:bg-hover hover:text-ink"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </Tooltip>
        ) : null}
      </div>

      <div className={cn("px-3 pb-3 pt-2", schmal && "px-2")}>
        {schmal ? (
          <Tooltip content="Suchen oder springen" side="right">
            <button
              type="button"
              onClick={suchen}
              aria-label="Suchen oder springen"
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
            <span className="min-w-0 flex-1 truncate text-left">Suchen …</span>
            <Kbd className="pointer-coarse:hidden">
              <ModK />
            </Kbd>
          </button>
        )}
      </div>

      <nav className={cn("min-h-0 flex-1 overflow-y-auto pb-4", schmal ? "px-2" : "px-3")} aria-label="Hauptnavigation">
        {einstellungen ? (
          <div>
            <NavLink eintrag={{ href: "/verwaltung/kalender", label: "Zurück", icon: ChevronLeft }} aktiv={false} schmal={schmal} />
            {schmal ? (
              <div className="mx-auto my-3 h-px w-6 bg-line" />
            ) : (
              <div className="mb-3 mt-1 border-b border-line px-2.5 pb-3 pt-1">
                <div className="truncate text-[14px] font-semibold text-ink">Einstellungen</div>
                <div className="mt-0.5 truncate text-[12px] text-subtle">Das Wichtigste auf einen Blick</div>
              </div>
            )}
            <ul className="flex flex-col gap-0.5">
              <li>
                <NavLink
                  eintrag={{ href: "/verwaltung/einstellungen", label: "Übersicht", icon: LayoutGrid }}
                  aktiv={pfad === "/verwaltung/einstellungen"}
                  schmal={schmal}
                />
              </li>
            </ul>
            <div className="mt-4">
              {schmal ? (
                <div className="mx-auto mb-3 h-px w-6 bg-line" />
              ) : (
                <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Bereiche</div>
              )}
              <ul className="flex flex-col gap-0.5">
                {EINSTELLUNGEN.map((e) => (
                  <li key={e.href}>
                    <NavLink eintrag={e} aktiv={istAktiv(pfad, e.href)} schmal={schmal} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-0.5">
              {HAUPT.map((e) => (
                <li key={e.href}>
                  <NavLink eintrag={e} aktiv={istAktiv(pfad, e.href)} schmal={schmal} />
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {schmal ? (
                <div className="mx-auto mb-3 h-px w-6 bg-line" />
              ) : (
                <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">Ansicht</div>
              )}
              <NavLink eintrag={{ href: "/", label: "Ansicht öffnen", icon: Eye }} aktiv={false} schmal={schmal} />
            </div>
          </>
        )}
      </nav>

      <div className={cn("flex items-center gap-1 border-t border-line p-3", schmal && "flex-col-reverse p-2")}>
        <div className={cn("min-w-0", schmal ? "w-full" : "flex-1")}>
          <Benutzermenue admin={admin} schmal={schmal} />
        </div>
        <ZahnradMenue schmal={schmal} pfad={pfad} />
      </div>

      {umschalten && schmal ? (
        <div className="px-2 pb-2">
          <Tooltip content="Seitenleiste ausklappen" side="right">
            <button
              type="button"
              onClick={umschalten}
              aria-label="Seitenleiste ausklappen"
              className="grid h-9 w-full place-items-center rounded-md text-subtle hover:bg-hover hover:text-ink"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}

/** ⌘K auf dem Mac, Strg+K unter Windows – erst im Browser bekannt */
function ModK() {
  const mac = useSyncExternalStore(
    () => () => {},
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => true,
  );
  return <>{mac ? "⌘K" : "Strg+K"}</>;
}

/** Menüpunkt wie KBN: 13,5 px, Symbol 18 px, aktiv grau hinterlegt mit rotem Balken links. */
function NavLink({ eintrag, aktiv, schmal }: { eintrag: NavEintrag; aktiv: boolean; schmal: boolean }) {
  const Icon = eintrag.icon;
  const link = (
    <Link
      href={eintrag.href}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-[var(--radius-control)] text-[13.5px] font-medium tracking-[-0.005em] transition-colors",
        schmal ? "justify-center" : "px-2.5",
        aktiv ? "bg-active text-ink" : "text-muted hover:bg-hover hover:text-ink",
      )}
    >
      {aktiv ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-x-[3px] -translate-y-1/2 rounded-full bg-accent" /> : null}
      <Icon className={cn("size-[18px] shrink-0", aktiv ? "text-accent-ink" : "text-subtle group-hover:text-ink")} />
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
  const rolle = admin.role === "superadmin" ? "Super-Admin" : "Administrator";
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
          {schmal ? (
            <span className="sr-only">Mein Konto</span>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{admin.name}</span>
              <span className="block truncate text-[12px] text-subtle">{admin.email}</span>
            </span>
          )}
        </button>
      </MenuTrigger>
      <MenuContent align="start" side="top" className="w-72">
        <div className="px-2.5 py-2">
          <div className="truncate text-[13.5px] font-medium text-ink">{admin.name}</div>
          <div className="truncate text-[12px] text-subtle">{admin.email}</div>
          <div className="mt-2 rounded-md bg-elevated px-2 py-1.5 text-[12px] shadow-[inset_0_0_0_1px_var(--line)]">
            <div className="truncate font-medium text-ink">
              <MarkeName />
            </div>
            <div className="text-subtle">{rolle}</div>
          </div>
        </div>
        <MenuSeparator />
        <MenuItem asChild>
          <Link href="/verwaltung/konto">
            <UserRound />
            Mein Konto
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/">
            <Eye />
            Ansicht öffnen
          </Link>
        </MenuItem>
        <div className="px-2.5 py-2">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">Darstellung</div>
          <HellDunkel />
        </div>
        <MenuSeparator />
        <MenuItem onSelect={() => void abmelden()}>
          <LogOut />
          Abmelden
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function MarkeKopf() {
  return <span className="truncate text-[14px] font-semibold text-ink">{useContext(MarkeKontext).name}</span>;
}

function MarkeName() {
  return <>{useContext(MarkeKontext).name}</>;
}

/** Hell/Dunkel als Segment-Leiste wie in KBN – der Stand kommt aus dem <html>-Attribut */
function HellDunkel() {
  const dunkel = useSyncExternalStore(
    (cb) => {
      const b = new MutationObserver(cb);
      b.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => b.disconnect();
    },
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  return (
    <Segmented
      size="sm"
      label="Darstellung"
      value={dunkel ? "dark" : "light"}
      onChange={(v) => (v === "dark") !== dunkel && farbschemaUmschalten()}
      className="flex w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:justify-center [&>button]:gap-1 [&>button]:px-1.5"
      options={[
        { value: "light", label: "Hell", icon: <Sun /> },
        { value: "dark", label: "Dunkel", icon: <Moon /> },
      ]}
    />
  );
}

/** Das Zahnrad unten rechts: Einstellungen, Darstellung, Benutzer, Protokoll. */
function ZahnradMenue({ schmal, pfad }: { schmal: boolean; pfad: string }) {
  const hier = inEinstellungen(pfad);
  const punkte: NavEintrag[] = [
    { href: "/verwaltung/einstellungen", label: "Einstellungen", icon: Settings, text: "Alle Bereiche auf einen Blick" },
    ...EINSTELLUNGEN.filter((e) => e.href !== "/verwaltung/konto"),
  ];
  return (
    <Menu>
      <Tooltip content="Einstellungen" side={schmal ? "right" : "top"}>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label="Einstellungen"
            className={cn(
              "relative grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] transition-colors",
              schmal && "w-full",
              hier ? "bg-active text-accent-ink" : "text-subtle hover:bg-hover hover:text-ink",
            )}
          >
            <Settings aria-hidden className="size-[18px]" />
          </button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent side={schmal ? "right" : "top"} align="end" className="w-72">
        <MenuLabel>Einstellungen</MenuLabel>
        {punkte.map((p) => {
          const Symbol = p.icon;
          const an = pfad === p.href || (p.href !== "/verwaltung/einstellungen" && istAktiv(pfad, p.href));
          return (
            <MenuItem key={p.href} asChild className={cn("items-start", an && "bg-active")}>
              <Link href={p.href} aria-current={an ? "page" : undefined}>
                <Symbol className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{p.label}</span>
                  {p.text ? <span className="block text-[12px] text-subtle">{p.text}</span> : null}
                </span>
              </Link>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
