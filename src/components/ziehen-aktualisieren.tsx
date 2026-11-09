"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { aktualisieren } from "@/components/pwa";
import { cn } from "@/components/ui/cn";

const SCHWELLE = 70; // so weit (nach Dämpfung) ziehen, dann wird beim Loslassen aktualisiert
const MAX = 110;

/** Steht das Element (oder ein scrollbarer Vorfahre) schon ganz oben? */
function ganzOben(ziel: EventTarget | null): boolean {
  if (window.scrollY > 0) return false;
  for (let el = ziel as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    const stil = getComputedStyle(el);
    if (/(auto|scroll)/.test(stil.overflowY) && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return false;
  }
  return true;
}

/**
 * „Nach unten ziehen zum Aktualisieren“ wie in iOS-Apps: ganz oben nach unten ziehen,
 * loslassen → neueste Fassung laden (wie der Knopf oben). Nicht in Blättern/Dialogen.
 */
export function ZiehenZumAktualisieren() {
  const [weg, setWeg] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const aktiv = useRef(false);
  const wegRef = useRef(0);

  useEffect(() => {
    const beginn = (e: TouchEvent) => {
      const ziel = e.target as HTMLElement;
      if (e.touches.length !== 1 || ziel.closest("[role=dialog]") || !ganzOben(ziel)) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      aktiv.current = false;
    };
    const bewegung = (e: TouchEvent) => {
      const s = start.current;
      if (!s) return;
      const dx = e.touches[0].clientX - s.x;
      const dy = e.touches[0].clientY - s.y;
      if (!aktiv.current) {
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          // seitlich wischen oder hochscrollen: nicht unser Fall
          if (Math.abs(dx) > 8 || dy < -8) start.current = null;
          return;
        }
        if (dy < 8) return;
        aktiv.current = true;
      }
      wegRef.current = Math.min(MAX, (dy - 8) * 0.5);
      setWeg(wegRef.current);
    };
    const ende = () => {
      if (aktiv.current && wegRef.current >= SCHWELLE) {
        setLaeuft(true);
        setWeg(SCHWELLE);
        void aktualisieren();
      } else {
        setWeg(0);
      }
      wegRef.current = 0;
      start.current = null;
      aktiv.current = false;
    };
    window.addEventListener("touchstart", beginn, { passive: true });
    window.addEventListener("touchmove", bewegung, { passive: true });
    window.addEventListener("touchend", ende);
    window.addEventListener("touchcancel", ende);
    return () => {
      window.removeEventListener("touchstart", beginn);
      window.removeEventListener("touchmove", bewegung);
      window.removeEventListener("touchend", ende);
      window.removeEventListener("touchcancel", ende);
    };
  }, []);

  if (!weg && !laeuft) return null;
  const anteil = Math.min(1, weg / SCHWELLE);
  return (
    <div
      aria-live="polite"
      className={cn(
        "glas pointer-events-none fixed left-1/2 z-40 grid size-10 -translate-x-1/2 place-items-center rounded-full text-marke-700",
        !weg && "transition-all",
      )}
      style={{ top: `calc(59px + env(safe-area-inset-top) + ${weg - 30}px)`, opacity: laeuft ? 1 : anteil }}
    >
      <RefreshCw
        className={cn("size-5", laeuft && "animate-spin")}
        strokeWidth={2}
        style={laeuft ? undefined : { transform: `rotate(${anteil * 270}deg)` }}
        aria-hidden
      />
      <span className="sr-only">{laeuft ? "Wird aktualisiert" : anteil >= 1 ? "Loslassen zum Aktualisieren" : ""}</span>
    </div>
  );
}
