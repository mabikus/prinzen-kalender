"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing, Check, X } from "lucide-react";
import {
  pushAbmelden,
  pushAnmelden,
  pushEinstellungenLesen,
  pushEinstellungenSetzen,
  pushProbe,
  pushSchluessel,
} from "@/app/(oeffentlich)/push-aktion";

// Push-Mitteilungen bei Terminänderungen. iPhone/iPad: nur in der installierten App (ab iOS 16.4) und nur nach
// Antippen eines Knopfs (die Erlaubnis-Frage darf nicht ungefragt kommen). Android/PC: auch im Browser.

type Stand = "laden" | "nicht-moeglich" | "erst-installieren" | "blockiert" | "aus" | "an";

const istIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const installiert = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const moeglich = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function schluesselBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const roh = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(roh.length));
  for (let i = 0; i < roh.length; i++) bytes[i] = roh.charCodeAt(i);
  return bytes;
}

async function aktuellesAbo(): Promise<PushSubscription | null> {
  if (!moeglich()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

async function staendlesen(): Promise<Stand> {
  if (!moeglich()) return istIos() && !installiert() ? "erst-installieren" : "nicht-moeglich";
  if (istIos() && !installiert()) return "erst-installieren";
  if (Notification.permission === "denied") return "blockiert";
  return (await aktuellesAbo()) && Notification.permission === "granted" ? "an" : "aus";
}

/** Nach `ms` aufgeben (der Push-Dienst antwortet manchmal nicht, z. B. ohne Netz) */
function mitFrist<T>(p: Promise<T>, ms = 20_000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, nein) => window.setTimeout(() => nein(new Error("Zeit abgelaufen")), ms))]);
}

/** Erlaubnis fragen und Gerät anmelden – nur aus einem Knopfdruck heraus aufrufen */
async function einschalten(): Promise<Stand> {
  const erlaubnis = await Notification.requestPermission();
  if (erlaubnis !== "granted") return erlaubnis === "denied" ? "blockiert" : "aus";
  const schluessel = await pushSchluessel();
  if (!schluessel) return "nicht-moeglich";
  const reg = await navigator.serviceWorker.ready;
  let abo = await reg.pushManager.getSubscription();
  const anmelden = () => mitFrist(reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: schluesselBytes(schluessel) }));
  try {
    abo ??= await anmelden();
  } catch (e) {
    if ((e as Error).message === "Zeit abgelaufen" || !abo) throw e;
    // Alte Anmeldung mit anderem Schlüssel: einmal neu
    await abo.unsubscribe();
    abo = await anmelden();
  }
  return (await pushAnmelden(abo.toJSON())) ? "an" : "aus";
}

/** Nach PIN-Eingabe/-Sperre oder erneuerter Anmeldung: Gerät beim Server auffrischen (falls Mitteilungen an) */
export async function pushAuffrischen() {
  try {
    if (!moeglich() || Notification.permission !== "granted") return;
    const abo = await aktuellesAbo();
    if (abo) await pushAnmelden(abo.toJSON());
    else await einschalten();
  } catch {
    // nächstes Mal
  }
}

function useStand() {
  const [stand, setStand] = useState<Stand>("laden");
  const neu = useCallback(() => void staendlesen().then(setStand), []);
  useEffect(() => {
    neu();
  }, [neu]);
  return [stand, setStand] as const;
}

/** Bereich unter Einstellungen */
export function MitteilungenBereich() {
  const [stand, setStand] = useStand();
  const [laeuft, starte] = useTransition();
  const [meldung, setMeldung] = useState<string | null>(null);

  const knopf = "inline-flex h-11 items-center gap-2 rounded-full px-5 font-semibold disabled:opacity-60";
  return (
    <section className="space-y-4 rounded-lg border border-linie bg-panel p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
          {stand === "an" ? <BellRing className="size-[18px]" /> : <Bell className="size-[18px]" />}
        </span>
        <div>
          <h2 className="font-serif lining-nums text-2xl font-semibold">Mitteilungen</h2>
          <p className="text-[15px] text-grau">Eine Nachricht aufs Handy, wenn ein Termin neu ist, sich ändert oder ausfällt.</p>
        </div>
      </div>

      {stand === "laden" ? <div aria-hidden className="h-11" /> : null}
      {stand === "erst-installieren" ? (
        <p className="text-[15px]">
          Am iPhone gehen Mitteilungen nur in der installierten App: erst oben bei „Als App installieren“ die App auf den
          Home-Bildschirm holen, sie von dort öffnen und dann hier einschalten.
        </p>
      ) : null}
      {stand === "nicht-moeglich" ? (
        <p className="text-[15px] text-grau">Dieser Browser kann keine Mitteilungen empfangen.</p>
      ) : null}
      {stand === "blockiert" ? (
        <p className="text-[15px]">
          Mitteilungen sind für diese App ausgeschaltet. Am iPhone in den Einstellungen unter Mitteilungen bei dieser App erlauben, danach hier noch einmal
          versuchen.
        </p>
      ) : null}
      {stand === "aus" ? (
        <button
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              setMeldung(null);
              try {
                setStand(await einschalten());
              } catch {
                setMeldung("Hat nicht geklappt – bitte noch einmal versuchen.");
              }
            })
          }
          className={`${knopf} bg-marke-700 text-white active:bg-marke-800`}
        >
          <Bell className="size-[18px]" />
          {laeuft ? "Einen Moment …" : "Mitteilungen einschalten"}
        </button>
      ) : null}
      {stand === "an" ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-medium text-marke-700">
            <Check className="size-5" /> Eingeschaltet auf diesem Gerät
          </p>
          <GeraetAuswahl />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={laeuft}
              onClick={() =>
                starte(async () => {
                  const abo = await aktuellesAbo();
                  if (!abo) return setMeldung("Auf diesem Gerät ist keine Anmeldung mehr da – bitte aus- und wieder einschalten.");
                  const r = await pushProbe(abo.endpoint);
                  setMeldung(r.ok ? "Probe-Mitteilung ist unterwegs." : `Die Probe kam nicht durch. Grund: ${r.grund}`);
                })
              }
              className={`${knopf} border border-linie text-tinte active:bg-stone-100`}
            >
              Probe schicken
            </button>
            <button
              type="button"
              disabled={laeuft}
              onClick={() =>
                starte(async () => {
                  const abo = await aktuellesAbo();
                  if (abo) {
                    await pushAbmelden(abo.endpoint);
                    await abo.unsubscribe();
                  }
                  setMeldung(null);
                  setStand("aus");
                })
              }
              className={`${knopf} border border-linie text-tinte active:bg-stone-100`}
            >
              <BellOff className="size-[18px]" />
              Ausschalten
            </button>
          </div>
        </div>
      ) : null}
      {meldung ? <p className="text-[15px] text-grau">{meldung}</p> : null}
    </section>
  );
}

const ERINNERUNG: { wert: number | null; text: string }[] = [
  { wert: null, text: "Aus" },
  { wert: 30, text: "30 Min." },
  { wert: 60, text: "1 Std." },
  { wert: 120, text: "2 Std." },
];

/** Was dieses Gerät bekommt: Änderungen/Absagen an oder aus, Erinnerung vor dem Termin – sofort gespeichert */
function GeraetAuswahl() {
  const [e, setE] = useState<{ aenderungen: boolean; erinnerung: number | null } | null>(null);
  const [gespeichert, setGespeichert] = useState(false);
  useEffect(() => {
    let aktiv = true;
    void aktuellesAbo().then(async (abo) => {
      const w = abo ? await pushEinstellungenLesen(abo.endpoint) : null;
      if (aktiv) setE(w ?? { aenderungen: true, erinnerung: null });
    });
    return () => {
      aktiv = false;
    };
  }, []);
  if (!e) return <div aria-hidden className="h-[118px]" />;
  const setzen = async (neu: { aenderungen: boolean; erinnerung: number | null }) => {
    setE(neu);
    setGespeichert(false);
    const abo = await aktuellesAbo();
    if (abo && (await pushEinstellungenSetzen(abo.endpoint, neu))) {
      setGespeichert(true);
      window.setTimeout(() => setGespeichert(false), 1800);
    }
  };
  return (
    <div className="divide-y divide-linie overflow-hidden rounded-lg border border-linie">
      <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
        <span>
          <span className="block font-medium">Bei Änderungen und Absagen</span>
          <span className="block text-[14px] text-grau">Neue Termine, geänderte Zeiten oder Orte, Absagen</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={e.aenderungen}
          onChange={(x) => void setzen({ ...e, aenderungen: x.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-marke-700 ${e.aenderungen ? "bg-marke-700" : "bg-stone-300"}`}
        >
          <span
            className={`absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-[left] duration-200 ${e.aenderungen ? "left-[22px]" : "left-[2px]"}`}
          />
        </span>
      </label>
      <div className="space-y-2 px-4 py-3">
        <span className="block font-medium">Erinnerung vor dem Termin</span>
        <span className="block text-[14px] text-grau">Vor der Treffzeit, sonst vor dem Beginn – für jeden Termin.</span>
        <div role="radiogroup" aria-label="Erinnerung vor dem Termin" className="grid grid-cols-4 gap-1 rounded-[10px] bg-stone-100 p-1">
          {ERINNERUNG.map((o) => {
            const an = e.erinnerung === o.wert;
            return (
              <button
                key={o.text}
                type="button"
                role="radio"
                aria-checked={an}
                onClick={() => void setzen({ ...e, erinnerung: o.wert })}
                className={`h-9 rounded-[8px] text-[14px] font-semibold transition-colors ${an ? "bg-white text-marke-700 shadow-sm dark:bg-stone-200" : "text-tinte/70"}`}
              >
                {o.text}
              </button>
            );
          })}
        </div>
      </div>
      <p className={`px-4 py-2 text-[13px] text-grau transition-opacity ${gespeichert ? "opacity-100" : "opacity-0"}`} aria-live="polite">
        Gespeichert
      </p>
    </div>
  );
}

const SPEICHER = "pk-mitteilungen-hinweis";
const PAUSE_MS = 14 * 24 * 60 * 60_000;

/** Einmal in der installierten App: „Mitteilungen einschalten?“ (dort klappt Push auch am iPhone) */
export function MitteilungenHinweis() {
  const [offen, setOffen] = useState(false);
  const [laeuft, starte] = useTransition();

  useEffect(() => {
    if (!moeglich() || !installiert() || Notification.permission !== "default") return;
    try {
      if (Date.now() - Number(localStorage.getItem(SPEICHER) ?? 0) < PAUSE_MS) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setOffen(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const zu = () => {
    try {
      localStorage.setItem(SPEICHER, String(Date.now()));
    } catch {
      // egal
    }
    setOffen(false);
  };

  return (
    <AnimatePresence>
      {offen ? (
        <motion.div
          role="dialog"
          aria-label="Mitteilungen einschalten"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
          className="vt-hinweis-push fixed inset-x-3 bottom-[calc(var(--tab-platz)+0.25rem)] z-40 mx-auto max-w-md rounded-[22px] border border-linie bg-panel p-4 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.35)] sm:bottom-6"
        >
          <button
            type="button"
            onClick={zu}
            aria-label="Hinweis schließen"
            className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full text-grau active:bg-stone-100"
          >
            <X className="size-[18px]" strokeWidth={2} />
          </button>
          <div className="mb-3 flex items-center gap-3 pr-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-marke-50 text-marke-700">
              <BellRing className="size-6" />
            </span>
            <div>
              <p className="font-serif text-[18px] font-semibold leading-tight">Mitteilungen einschalten?</p>
              <p className="text-[14px] text-grau">Dann kommt eine Nachricht, wenn ein Termin neu ist, sich ändert oder ausfällt.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={laeuft}
              onClick={() =>
                starte(async () => {
                  await einschalten().catch(() => "aus");
                  zu();
                })
              }
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-marke-700 font-semibold text-white active:bg-marke-800 disabled:opacity-60"
            >
              <Bell className="size-[18px]" />
              Einschalten
            </button>
            <button type="button" onClick={zu} className="h-12 rounded-full border border-linie px-5 font-semibold text-tinte active:bg-stone-100">
              Später
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
