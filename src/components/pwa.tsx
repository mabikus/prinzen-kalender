"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { datenFrischHolen } from "@/app/aktualisieren-aktion";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const PRUEFEN_ALLE_MS = 15 * 60_000;

/** Meldet den Service Worker an (nur im Produktivbetrieb). */
export function DienstHelfer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    // Der Push-Dienst hat die Anmeldung erneuert (Meldung vom Service Worker): beim Server auffrischen
    const nachricht = (e: MessageEvent) => {
      if (e.data?.typ === "push-erneuern") void import("./mitteilungen").then((m) => m.pushAuffrischen());
    };
    navigator.serviceWorker.addEventListener("message", nachricht);
    return () => navigator.serviceWorker.removeEventListener("message", nachricht);
  }, []);
  return null;
}

/** Speicher der App leeren und neuen Service Worker holen */
async function speicherLeeren() {
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    // dann eben ohne
  }
}

/**
 * Neue App-Version laden: Speicher leeren und Seite frisch öffnen (oben – iOS zeichnet beim Neuladen mit
 * wiederhergestellter Scrollposition in der Home-Bildschirm-App manchmal nur Teile der Seite).
 */
export async function aktualisieren() {
  await speicherLeeren();
  window.scrollTo(0, 0);
  window.location.replace(window.location.pathname + window.location.search);
}

const warte = (ms: number) => new Promise((ok) => window.setTimeout(ok, ms));
const MINDESTENS_MS = 900;

/**
 * Aktualisieren ohne Flackern: Daten frisch holen und still einsetzen (keine neu geladene Seite).
 * Mindestens knapp eine Sekunde sichtbar, damit es ruhig wirkt. Nur bei neuer App-Version komplett neu laden.
 */
export function useAktualisieren() {
  const router = useRouter();
  const [eigen, setEigen] = useState(false);
  const [wartet, starte] = useTransition();
  const laeuft = eigen || wartet;

  const start = useCallback(async () => {
    if (eigen) return;
    setEigen(true);
    const mindestens = warte(MINDESTENS_MS);
    if (await neueVersion()) {
      await mindestens;
      return aktualisieren();
    }
    try {
      await Promise.all([datenFrischHolen(), speicherLeeren()]);
    } catch {
      // offline: zeigt einfach den bisherigen Stand
    }
    starte(() => router.refresh());
    await mindestens;
    setEigen(false);
  }, [eigen, router]);

  return { laeuft, start };
}

/** Aktualisieren-Symbol: dreht ruhig und läuft am Ende weich bis zur vollen Umdrehung aus */
export function DrehSymbol({ dreht, className, strokeWidth = 1.75 }: { dreht: boolean; className?: string; strokeWidth?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const vorher = useRef(dreht);
  useEffect(() => {
    const el = ref.current;
    if (!el || vorher.current === dreht) return;
    vorher.current = dreht;
    if (dreht) return;
    // gerade gestoppt: von der aktuellen Lage weich bis 360° auslaufen
    const winkel = Number(el.dataset.winkel ?? 0);
    if (!winkel) return;
    el.animate([{ transform: `rotate(${winkel}deg)` }, { transform: "rotate(360deg)" }], {
      duration: 250 + ((360 - winkel) / 360) * 450,
      easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    });
  }, [dreht]);
  // aktuelle Lage der laufenden Drehung merken (für das Auslaufen)
  useEffect(() => {
    if (!dreht) return;
    const el = ref.current;
    let id = 0;
    const t0 = performance.now();
    const merken = () => {
      if (el) el.dataset.winkel = String((((performance.now() - t0) % 1200) / 1200) * 360);
      id = requestAnimationFrame(merken);
    };
    id = requestAnimationFrame(merken);
    return () => cancelAnimationFrame(id);
  }, [dreht]);
  return (
    <span ref={ref} className={cn("inline-grid place-items-center", dreht && "ui-drehen")}>
      <RefreshCw className={className} strokeWidth={strokeWidth} aria-hidden />
    </span>
  );
}

/** Knopf „Aktualisieren“ für die Kopfzeile */
export function AktualisierenKnopf({ className }: { className?: string }) {
  const { laeuft, start } = useAktualisieren();
  return (
    <button
      type="button"
      onClick={() => void start()}
      aria-label={laeuft ? "Wird aktualisiert" : "Aktualisieren"}
      aria-busy={laeuft}
      title="Aktualisieren"
      className={cn("grid size-10 place-items-center rounded-full", className)}
    >
      <DrehSymbol dreht={laeuft} className="size-[19px]" />
    </button>
  );
}

/** Ist eine neuere Version veröffentlicht als die, die gerade läuft? */
async function neueVersion(): Promise<boolean> {
  const eigene = process.env.APP_VERSION;
  if (!eigene) return false;
  try {
    const r = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return false;
    const { version } = (await r.json()) as { version: string | null };
    return !!version && version !== eigene;
  } catch {
    return false; // offline
  }
}

/**
 * Prüft beim Öffnen, beim Zurückholen der App und alle 15 Minuten auf eine neue Version
 * und zeigt dann oben einen Hinweis mit „Aktualisieren“.
 */
export function UpdateHinweis() {
  const [neu, setNeu] = useState(false);
  const [laeuft, setLaeuft] = useState(false);

  const pruefen = useCallback(async () => {
    if (await neueVersion()) setNeu(true);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const sichtbar = () => document.visibilityState === "visible" && void pruefen();
    const start = window.setTimeout(() => void pruefen(), 3000);
    const id = window.setInterval(() => void pruefen(), PRUEFEN_ALLE_MS);
    document.addEventListener("visibilitychange", sichtbar);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sichtbar);
    };
  }, [pruefen]);

  if (!neu) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[70] mx-auto flex max-w-md animate-fade-in items-center gap-3 rounded-[14px] bg-panel p-1.5 pl-4 shadow-[var(--shadow-pop)]"
    >
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">Neue Version verfügbar</span>
      <button
        type="button"
        onClick={() => {
          setLaeuft(true);
          void aktualisieren();
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[15px] font-semibold text-accent-fg active:bg-accent-hover"
      >
        {laeuft ? <DrehSymbol dreht className="size-4" strokeWidth={2} /> : null}
        Aktualisieren
      </button>
      <button type="button" onClick={() => setNeu(false)} aria-label="Später" className="grid size-9 shrink-0 place-items-center rounded-full text-subtle active:bg-hover">
        <X className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
