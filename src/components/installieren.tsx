"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Download, Ellipsis, Share, SquarePlus, X } from "lucide-react";

// Hinweis „Als App auf den Home-Bildschirm“. iPhone/iPad erlauben keinen eigenen Installieren-Knopf – dort eine
// kurze Anleitung (Teilen → Zum Home-Bildschirm). Android/Chrome melden `beforeinstallprompt`: dann ein echter Knopf.
// Nie in der schon installierten App; weggeklickt kommt er erst nach zwei Wochen wieder.

const SPEICHER = "pk-installieren-hinweis";
const PAUSE_MS = 14 * 24 * 60 * 60_000;

type Plattform = "ios" | "andere";


interface InstallEreignis extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function istInstalliert() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function plattform(): Plattform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "andere";
}

function pausiert(): boolean {
  try {
    const t = Number(localStorage.getItem(SPEICHER) ?? 0);
    return Date.now() - t < PAUSE_MS;
  } catch {
    return false;
  }
}

function pausieren() {
  try {
    localStorage.setItem(SPEICHER, String(Date.now()));
  } catch {
    // privates Fenster: dann eben beim nächsten Mal wieder
  }
}

/** Gemerktes Installations-Ereignis von Chrome/Android (kommt meist kurz nach dem Laden) */
let gemerkt: InstallEreignis | null = null;
const hoerer = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    gemerkt = e as InstallEreignis;
    hoerer.forEach((h) => h());
  });
  window.addEventListener("appinstalled", () => {
    gemerkt = null;
    hoerer.forEach((h) => h());
  });
}
function useInstallEreignis() {
  return useSyncExternalStore(
    (cb) => (hoerer.add(cb), () => hoerer.delete(cb)),
    () => gemerkt,
    () => null,
  );
}

async function installieren(e: InstallEreignis) {
  await e.prompt();
  await e.userChoice.catch(() => null);
  gemerkt = null;
  hoerer.forEach((h) => h());
}

function Anleitung() {
  return (
    <ol className="space-y-2 text-[15px] leading-snug">
      <li className="flex items-center gap-3">
        <Schritt n={1} />
        <span>
          Unten auf <Share className="mx-0.5 inline size-[18px] -translate-y-0.5 text-info" aria-label="Teilen" /> tippen
          <span className="text-grau"> (in Safari ggf. erst auf </span>
          <Ellipsis className="inline size-4 text-grau" aria-label="Mehr" />
          <span className="text-grau">)</span>
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Schritt n={2} />
        <span>
          <SquarePlus className="mr-1 inline size-[18px] -translate-y-0.5" aria-hidden />
          „Zum Home-Bildschirm“ wählen
        </span>
      </li>
      <li className="flex items-center gap-3">
        <Schritt n={3} />
        <span>Oben rechts auf „Hinzufügen“ tippen</span>
      </li>
    </ol>
  );
}

function Schritt({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marke-50 text-[13px] font-semibold text-marke-700">{n}</span>
  );
}

/** Einmaliger Hinweis unten über der Tab-Leiste (nur Handy/Tablet-Browser, nicht in der App) */
export function InstallHinweis({ logoStand }: { logoStand: number }) {
  const [offen, setOffen] = useState(false);
  const [ios, setIos] = useState(false);
  const ereignis = useInstallEreignis();

  useEffect(() => {
    if (istInstalliert() || pausiert()) return;
    const p = plattform();
    // Android/Chrome: nur, wenn der Browser die Installation anbietet (das Ereignis kommt teils erst später)
    if (p !== "ios" && !ereignis) return;
    // Erst kurz ankommen lassen, dann ruhig einblenden
    const t = window.setTimeout(() => {
      setIos(p === "ios");
      setOffen(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [ereignis]);

  const zeigen = offen && (ios || !!ereignis);
  const schliessen = () => {
    pausieren();
    setOffen(false);
  };

  return (
    <AnimatePresence>
      {zeigen ? (
        <motion.div
          role="dialog"
          aria-label="Als App installieren"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
          className="fixed inset-x-3 bottom-[calc(var(--tab-platz)+0.25rem)] z-40 mx-auto max-w-md rounded-[22px] border border-linie bg-panel p-4 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.35)] sm:bottom-6"
        >
          <button
            type="button"
            onClick={schliessen}
            aria-label="Hinweis schließen"
            className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full text-grau active:bg-stone-100"
          >
            <X className="size-[18px]" strokeWidth={2} />
          </button>
          <div className="mb-3 flex items-center gap-3 pr-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- App-Symbol (dynamisch) */}
            <img src={`/app-icon/apple?v=${logoStand}`} alt="" width={48} height={48} className="size-12 rounded-[12px] shadow-sm" />
            <div>
              <p className="font-serif text-[18px] font-semibold leading-tight">Als App installieren</p>
              <p className="text-[14px] text-grau">Mit eigenem Symbol – und auf Wunsch mit Mitteilung, wenn ein Termin ausfällt oder sich ändert.</p>
            </div>
          </div>
          {ios ? (
            <Anleitung />
          ) : ereignis ? (
            <button
              type="button"
              onClick={() => void installieren(ereignis).then(schliessen)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-marke-700 font-semibold text-white active:bg-marke-800"
            >
              <Download className="size-[18px]" />
              Installieren
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Für die Einstellungen: immer erreichbar, auch wenn der Hinweis weggeklickt wurde */
export function InstallBereich() {
  const ereignis = useInstallEreignis();
  const stand = useSyncExternalStore(
    () => () => {},
    () => (istInstalliert() ? "installiert" : plattform()),
    () => null,
  );
  if (stand === null) return null;
  return (
    <section className="space-y-4 rounded-lg border border-linie bg-panel p-5">
      <div>
        <h2 className="font-serif lining-nums text-2xl font-semibold">Als App installieren</h2>
        <p className="text-[15px] text-grau">Mit eigenem Symbol auf dem Home-Bildschirm – öffnet sich ohne Browserleiste wie eine App.</p>
      </div>
      {stand === "installiert" ? (
        <p className="flex items-center gap-2 font-medium text-marke-700">
          <Check className="size-5" /> Schon installiert – du nutzt gerade die App.
        </p>
      ) : stand === "ios" ? (
        <Anleitung />
      ) : ereignis ? (
        <button
          type="button"
          onClick={() => void installieren(ereignis)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-marke-700 px-5 font-semibold text-white active:bg-marke-800"
        >
          <Download className="size-[18px]" />
          Installieren
        </button>
      ) : (
        <p className="text-[15px] text-grau">
          Im Browser-Menü (⋮) auf „App installieren“ bzw. „Zum Startbildschirm hinzufügen“ tippen. Am iPhone geht es über
          Safari → Teilen → „Zum Home-Bildschirm“.
        </p>
      )}
    </section>
  );
}
