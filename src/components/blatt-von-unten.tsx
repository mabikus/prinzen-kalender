"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const ZU_MS = 260;
/** Bewegungskurve der iOS-Blätter: schnell los, weich auslaufen */
const IOS = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Blatt von unten wie bei iOS (fast Vollbild): Liste oder Monat bleiben dahinter stehen –
 * mit Scrollposition und gewähltem Tag. Schließen: X, Escape, nach unten wischen oder Zurück.
 */
export function BlattVonUnten({ titel, children }: { titel: string; children: React.ReactNode }) {
  const router = useRouter();
  const [zu, setZu] = useState(false);
  const [zug, setZug] = useState(0);
  const start = useRef<number | null>(null);

  // Next.js hält besuchte Ansichten versteckt vor (Cache Components). Beim Verstecken Zustand zurücksetzen,
  // sonst käme dasselbe Blatt beim nächsten Öffnen noch „zugeklappt“ zurück.
  useEffect(
    () => () => {
      setZu(false);
      setZug(0);
    },
    [],
  );

  const schliessen = () => {
    if (zu) return;
    setZu(true);
    window.setTimeout(() => router.back(), ZU_MS);
  };

  // Nach unten wischen (am Griff oben): Blatt folgt dem Finger, ab 110 px schließt es
  const griff = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return; // X-Knopf normal antippen lassen
      start.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current !== null) setZug(Math.max(0, e.clientY - start.current));
    },
    onPointerUp: () => {
      start.current = null;
      if (zug > 110) schliessen();
      else setZug(0);
    },
    onPointerCancel: () => {
      start.current = null;
      setZug(0);
    },
  };

  return (
    <D.Root open onOpenChange={(offen) => !offen && schliessen()}>
      <D.Portal>
        <D.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
            zu ? "opacity-0" : "animate-in fade-in-0 duration-300",
          )}
        />
        <D.Content
          aria-describedby={undefined}
          // Fokus nicht automatisch auf das X (sonst roter Fokusring beim Öffnen)
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={zug && !zu ? { transform: `translateY(${zug}px)`, transition: "none" } : undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-t-[18px] bg-papier shadow-[0_-8px_40px_rgb(0_0_0/0.25)] outline-none transition-transform sm:top-6",
            zu ? `translate-y-full duration-[260ms] ${IOS}` : `animate-in slide-in-from-bottom duration-500 ${IOS}`,
          )}
        >
          <div className="relative h-14 shrink-0 touch-none select-none pt-2" {...griff}>
            <div className="mx-auto h-[5px] w-10 rounded-full bg-stone-300" aria-hidden />
            <D.Title className="sr-only">{titel}</D.Title>
            <D.Close
              className="absolute right-3 top-2.5 grid size-9 place-items-center rounded-full bg-stone-200/80 text-grau active:bg-stone-300"
              aria-label="Schließen"
            >
              <X className="size-[18px]" strokeWidth={2} />
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
