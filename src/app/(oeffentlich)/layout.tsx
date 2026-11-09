import Link from "next/link";
import { Suspense } from "react";
import { Crown, TriangleAlert } from "lucide-react";
import { NavLinks, Navigation } from "@/components/navigation";
import { datenquelle } from "@/lib/daten";
import { zugangsToken } from "@/lib/zugang";

export default function OeffentlichLayout({ children }: { children: React.ReactNode }) {
  const quelle = datenquelle();
  const offen = !zugangsToken();
  return (
    <>
      <header className="sticky top-0 z-20 border-b-[3px] border-marke-800 bg-marke-700 text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
            <span className="flex size-8 items-center justify-center rounded-full bg-white text-marke-700">
              <Crown className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-serif lining-nums text-lg font-semibold tracking-wide">
              <span className="hidden min-[400px]:inline">Prinzen-</span>Kalender
              <span className="ml-1.5 hidden font-sans text-sm font-normal text-white/70 sm:inline">Session 26/27</span>
            </span>
          </Link>
          <Suspense fallback={<NavLinks pfad={null} />}>
            <Navigation />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-3xl space-y-1 px-4 pb-10 text-xs text-grau">
        {quelle === "startdaten" && <p>Datenquelle: Startdaten im Repo (Datenbank noch nicht verbunden).</p>}
        {offen && (
          <p className="flex items-center gap-1.5">
            <TriangleAlert className="size-3.5" strokeWidth={1.75} aria-hidden />
            Zugriffsschutz nicht aktiv – ZUGANG_TOKEN ist nicht gesetzt.
          </p>
        )}
      </footer>
    </>
  );
}
