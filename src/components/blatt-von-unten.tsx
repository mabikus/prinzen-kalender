"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { animate, motion, MotionConfig, useDragControls, useMotionValue, useTransform } from "motion/react";

/** Feder wie bei iOS-Blättern: zügig, ohne Nachschwingen */
const FEDER = { type: "spring", stiffness: 340, damping: 38, mass: 1 } as const;
/** Schließen: kurz und weich (nimmt den Schwung vom Wischen mit) */
const ZU = { duration: 0.28, ease: [0.32, 0.72, 0, 1] } as const;

const hoehe = () => (typeof window === "undefined" ? 1000 : window.innerHeight);

/**
 * Blatt von unten wie bei iOS (fast Vollbild): Liste oder Monat bleiben dahinter stehen –
 * mit Scrollposition und gewähltem Tag. Schließen: X, Escape, am Griff nach unten wischen oder Zurück.
 */
export function BlattVonUnten({ titel, children }: { titel: string; children: React.ReactNode }) {
  const router = useRouter();
  const y = useMotionValue(hoehe());
  const abdunkeln = useTransform(y, (v) => Math.max(0, 1 - v / Math.max(1, hoehe() * 0.9)));
  const ziehen = useDragControls();
  const zu = useRef(false);

  // Hochfahren – vor dem ersten Bild gestartet, auch wenn Next.js das Blatt aus dem Hintergrund
  // wieder zeigt (besuchte Ansichten bleiben versteckt erhalten)
  useLayoutEffect(() => {
    zu.current = false;
    y.set(hoehe());
    const a = animate(y, 0, FEDER);
    return () => a.stop();
  }, [y]);

  const schliessen = (schwung = 0) => {
    if (zu.current) return;
    zu.current = true;
    animate(y, hoehe(), { ...ZU, velocity: schwung }).then(() => router.back());
  };

  return (
    <MotionConfig reducedMotion="user">
      <D.Root open onOpenChange={(offen) => !offen && schliessen()}>
        <D.Portal>
          <D.Overlay asChild>
            <motion.div className="fixed inset-0 z-50 bg-black/40" style={{ opacity: abdunkeln }} />
          </D.Overlay>
          <D.Content
            asChild
            aria-describedby={undefined}
            // Fokus nicht automatisch auf das X (sonst roter Fokusring beim Öffnen)
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <motion.div
              style={{ y }}
              drag="y"
              dragControls={ziehen}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.04, bottom: 1 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 550) schliessen(info.velocity.y);
                else animate(y, 0, FEDER);
              }}
              className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 mx-auto flex max-w-3xl flex-col overflow-hidden rounded-t-[18px] bg-papier shadow-[0_-8px_40px_rgb(0_0_0/0.25)] outline-none will-change-transform sm:top-6"
            >
              {/* Griff: hier nach unten wischen schließt das Blatt */}
              <div
                className="relative h-14 shrink-0 cursor-grab touch-none select-none pt-2 active:cursor-grabbing"
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return; // X normal antippen lassen
                  ziehen.start(e);
                }}
              >
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
            </motion.div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </MotionConfig>
  );
}
