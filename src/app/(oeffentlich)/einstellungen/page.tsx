import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, UserCog } from "lucide-react";
import { I } from "@/components/termin";
import { PinFreischalten } from "@/components/pin-freischalten";
import { InstallBereich } from "@/components/installieren";
import { MitteilungenBereich } from "@/components/mitteilungen";
import { freigeschaltet, ladePin } from "@/lib/vertraulich";

export const metadata = { title: "Einstellungen" };

export default function EinstellungenSeite() {
  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b border-linie pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">Einstellungen</p>
        <h1 className="font-serif lining-nums text-4xl font-semibold">Einstellungen</h1>
      </header>

      <InstallBereich />

      <MitteilungenBereich />

      <Suspense fallback={null}>
        <Vertraulich />
      </Suspense>

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
  // Bewusst unauffällig und unten: Wer keinen Code hat, soll hier nicht herumprobieren
  return (
    <section className="space-y-3 rounded-lg border border-linie bg-panel px-4 py-4">
      <div>
        <h2 className="text-[16px] font-semibold">Weitere Termine</h2>
        <p className="text-[14px] text-grau">
          {frei
            ? "Auf diesem Gerät freigeschaltet – die zusätzlichen Termine stehen mit Schloss in Liste, Monat und Kalender-Abo."
            : "Mit einem Code vom Vorstand erscheinen zusätzliche Termine."}
        </p>
      </div>
      <PinFreischalten frei={frei} />
    </section>
  );
}
