"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/components/ui/cn";

const PRUEFEN_ALLE_MS = 15 * 60_000;

/** Meldet den Service Worker an (nur im Produktivbetrieb). */
export function DienstHelfer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/**
 * Holt die neueste Fassung: gespeicherte Seiten und Dateien löschen, neuen Service Worker holen, neu laden.
 * Wichtig für die App vom Home-Bildschirm – die bleibt sonst tagelang im Hintergrund offen.
 */
export async function aktualisieren() {
  try {
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    // dann eben nur neu laden
  }
  window.location.reload();
}

/** Knopf „Aktualisieren“ für die Kopfzeile */
export function AktualisierenKnopf({ className }: { className?: string }) {
  const [laeuft, setLaeuft] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setLaeuft(true);
        void aktualisieren();
      }}
      aria-label="Aktualisieren"
      title="Aktualisieren"
      className={cn("grid size-10 place-items-center rounded-full", className)}
    >
      <RefreshCw className={cn("size-[19px]", laeuft && "animate-spin")} strokeWidth={1.75} aria-hidden />
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
        {laeuft ? <RefreshCw className="size-4 animate-spin" strokeWidth={2} aria-hidden /> : null}
        Aktualisieren
      </button>
      <button type="button" onClick={() => setNeu(false)} aria-label="Später" className="grid size-9 shrink-0 place-items-center rounded-full text-subtle active:bg-hover">
        <X className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
