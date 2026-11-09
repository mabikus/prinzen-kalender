"use client";

import { useEffect, useRef, useState } from "react";
import { useAktualisieren } from "@/components/pwa";

const SCHWELLE = 64; // so weit (nach Dämpfung) ziehen, dann wird beim Loslassen aktualisiert
const HALTEN = 56; // so weit bleibt der Inhalt unten, solange aktualisiert wird
const MAX = 130;
const SPEICHEN = 8;
const IOS = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Steht das Element (oder ein scrollbarer Vorfahre) schon ganz oben? */
function ganzOben(ziel: EventTarget | null): boolean {
  if (window.scrollY > 0) return false;
  for (let el = ziel as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    const stil = getComputedStyle(el);
    if (/(auto|scroll)/.test(stil.overflowY) && el.scrollHeight > el.clientHeight && el.scrollTop > 0) return false;
  }
  return true;
}

/** Was beim Ziehen nach unten rutscht: der Monat (fest positioniert) oder sonst der Seiteninhalt */
const inhalt = () => document.querySelector<HTMLElement>("[data-zieh-inhalt]") ?? document.querySelector<HTMLElement>("main");

function verschieben(px: number, weich: boolean) {
  const el = inhalt();
  if (!el) return;
  el.style.transition = weich ? `transform 380ms ${IOS}` : "none";
  el.style.transform = px ? `translateY(${px}px)` : "";
}

/**
 * „Nach unten ziehen zum Aktualisieren“ wie bei iOS/Instagram: Der Inhalt rutscht mit dem Finger nach unten,
 * darüber erscheint der iOS-Kreisel (Speichen tauchen nacheinander auf). Loslassen hinter der Schwelle:
 * Inhalt bleibt kurz unten, Kreisel dreht, danach gleitet alles zurück. Nicht in Blättern/Dialogen.
 */
export function ZiehenZumAktualisieren() {
  const [weg, setWeg] = useState(0);
  const { laeuft, start: aktualisieren } = useAktualisieren();
  const aktualisierenRef = useRef(aktualisieren);
  const laeuftRef = useRef(laeuft);
  useEffect(() => {
    aktualisierenRef.current = aktualisieren;
  }, [aktualisieren]);

  // Aktualisieren fertig: Inhalt weich zurückgleiten lassen
  useEffect(() => {
    const vorher = laeuftRef.current;
    laeuftRef.current = laeuft;
    if (vorher && !laeuft) verschieben(0, true);
  }, [laeuft]);

  useEffect(() => {
    const start = { y: 0, x: 0, bereit: false, aktiv: false, weg: 0 };
    const beginn = (e: TouchEvent) => {
      const ziel = e.target as HTMLElement;
      start.bereit = false;
      if (laeuftRef.current || e.touches.length !== 1 || ziel.closest("[role=dialog]") || !ganzOben(ziel)) return;
      start.x = e.touches[0].clientX;
      start.y = e.touches[0].clientY;
      start.bereit = true;
      start.aktiv = false;
    };
    const bewegung = (e: TouchEvent) => {
      if (!start.bereit) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (!start.aktiv) {
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          if (Math.abs(dx) > 8 || dy < -8) start.bereit = false; // seitlich wischen oder hochscrollen
          return;
        }
        if (dy < 6) return;
        start.aktiv = true;
      }
      // Gummiband: anfangs fast 1:1, dann immer zäher
      const roh = Math.max(0, dy - 6);
      start.weg = Math.min(MAX, roh * 0.55 - (roh * roh) / 2400);
      verschieben(start.weg, false);
      setWeg(start.weg);
    };
    const ende = () => {
      if (!start.bereit) return;
      start.bereit = false;
      if (start.aktiv && start.weg >= SCHWELLE) {
        verschieben(HALTEN, true);
        setWeg(0);
        void aktualisierenRef.current();
      } else if (start.aktiv) {
        verschieben(0, true);
        setWeg(0);
      }
      start.aktiv = false;
      start.weg = 0;
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
      verschieben(0, false);
    };
  }, []);

  const hoehe = laeuft ? HALTEN : weg;
  const anteil = Math.min(1, weg / SCHWELLE);
  // beim Ziehen tauchen die Speichen nacheinander auf, beim Aktualisieren alle mit Verlauf
  const sichtbar = laeuft ? SPEICHEN : Math.floor(anteil * SPEICHEN);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-10 flex justify-center text-grau"
      style={{
        top: "calc(59px + env(safe-area-inset-top))",
        height: hoehe,
        opacity: hoehe ? 1 : 0,
        transition: weg ? "none" : `height 380ms ${IOS}, opacity 250ms ease-out`,
      }}
    >
      <svg viewBox="0 0 24 24" className={`mt-auto mb-auto size-7 ${laeuft ? "ui-kreisel" : ""}`} aria-hidden>
        {Array.from({ length: SPEICHEN }, (_, i) => (
          <line
            key={i}
            x1="12"
            y1="3.2"
            x2="12"
            y2="7.4"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            transform={`rotate(${i * (360 / SPEICHEN)} 12 12)`}
            opacity={i < sichtbar ? (laeuft ? 1 - ((SPEICHEN - i) % SPEICHEN) / (SPEICHEN + 2) : 0.9) : 0}
          />
        ))}
      </svg>
      <span className="sr-only">{laeuft ? "Wird aktualisiert" : anteil >= 1 ? "Loslassen zum Aktualisieren" : ""}</span>
    </div>
  );
}
