import Link from "next/link";
import { Suspense, ViewTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { FarbschemaKnopf } from "@/components/farbschema";
import { Logo } from "@/components/logo";
import { NavLinks, Navigation } from "@/components/navigation";
import { AktualisierenKnopf } from "@/components/pwa";
import { ZiehenZumAktualisieren } from "@/components/ziehen-aktualisieren";
import { datenquelle } from "@/lib/daten";
import { ladeMarke } from "@/lib/marke-laden";
import { zugangsToken } from "@/lib/zugang";

export default async function OeffentlichLayout({ children, modal }: LayoutProps<"/">) {
  const marke = await ladeMarke(); // zwischengespeichert (Verwaltung → Darstellung)
  const quelle = datenquelle();
  const offen = !zugangsToken();
  return (
    <>
      {/* Kopfzeile – als App unter der Statusleiste (Safe-Area) */}
      <header className="sticky top-0 z-20 border-b-[3px] border-kopf-rand bg-kopf pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Logo groesse={44} stand={marke.logoStand} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-serif text-[19px] font-semibold">{marke.name}</span>
              <span className="block text-[12px] text-white/75">{marke.untertitel}</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Suspense fallback={<NavLinks pfad={null} variante="oben" />}>
              <Navigation variante="oben" />
            </Suspense>
            <AktualisierenKnopf className="text-white/90 hover:bg-white/10 active:bg-white/15" />
            <FarbschemaKnopf className="-mr-2 text-white/90 hover:bg-white/10 active:bg-white/15" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-6">
        {/* Weicher Übergang nur beim Tab-Wechsel (Links mit transitionTypes={["tab"]}) – nicht beim
            Aktualisieren, Filtern oder Öffnen eines Termins */}
        <ViewTransition default="none" update={{ tab: "seite", default: "none" }}>
          {children}
        </ViewTransition>
      </main>
      <footer className="mx-auto max-w-3xl space-y-1 px-4 pb-[var(--tab-platz)] text-xs text-grau sm:pb-10">
        {quelle === "startdaten" && <p>Datenquelle: Startdaten im Repo (Datenbank noch nicht verbunden).</p>}
        {offen && (
          <p className="flex items-center gap-1.5">
            <TriangleAlert className="size-3.5" strokeWidth={1.75} aria-hidden />
            Zugriffsschutz nicht aktiv – ZUGANG_TOKEN ist nicht gesetzt.
          </p>
        )}
      </footer>
      <Suspense fallback={<NavLinks pfad={null} variante="unten" />}>
        <Navigation variante="unten" />
      </Suspense>
      <ZiehenZumAktualisieren />
      {/* Termin als Blatt über Liste/Monat (abgefangene Route @modal/(.)termin) */}
      {modal}
    </>
  );
}
