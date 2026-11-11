import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Lock, UserCog } from "lucide-react";
import { I } from "@/components/termin";
import { PinFreischalten } from "@/components/pin-freischalten";
import { InstallBereich } from "@/components/installieren";
import { freigeschaltet, ladePin } from "@/lib/vertraulich";

export const metadata = { title: "Einstellungen" };

export default function EinstellungenSeite() {
  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b border-linie pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">Einstellungen</p>
        <h1 className="font-serif lining-nums text-4xl font-semibold">Einstellungen</h1>
      </header>

      <Suspense fallback={<div aria-hidden className="h-[220px] animate-pulse rounded-lg bg-stone-200/40" />}>
        <Vertraulich />
      </Suspense>

      <InstallBereich />

      <Link
        href="/verwaltung"
        className="flex items-center gap-3 rounded-lg border border-linie bg-panel p-4 transition-colors active:bg-stone-100"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
          <I icon={UserCog} className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Verwaltung</span>
          <span className="block text-sm text-grau">Termine pflegen – nur mit Anmeldung</span>
        </span>
        <I icon={ChevronRight} className="size-5 text-grau" />
      </Link>
    </div>
  );
}

async function Vertraulich() {
  const [pin, frei] = await Promise.all([ladePin(), freigeschaltet()]);
  if (!pin) return null;
  return (
    <section className="space-y-4 rounded-lg border border-linie bg-panel p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
          <I icon={Lock} className="size-[18px]" />
        </span>
        <div>
          <h2 className="font-serif lining-nums text-2xl font-semibold">Vertrauliche Termine</h2>
          <p className="text-[15px] text-grau">
            {frei
              ? "Auf diesem Gerät freigeschaltet: Die vertraulichen Termine stehen mit Schloss in der Liste, im Monat und im Kalender-Abo."
              : "Für Eingeweihte, z. B. Vorstand und Familie: Mit der PIN erscheinen zusätzlich die vertraulichen Termine – auch im Kalender-Abo."}
          </p>
        </div>
      </div>
      <PinFreischalten frei={frei} />
    </section>
  );
}
