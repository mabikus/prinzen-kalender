import { headers } from "next/headers";
import { Suspense } from "react";
import { Kopieren } from "@/components/kopieren";
import { FILTER, type FilterName } from "@/lib/labels";
import { feedToken } from "@/lib/zugang";

export const metadata = { title: "Kalender-Abo" };

export default function AboSeite() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Kalender abonnieren</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Einmal abonnieren, dann erscheinen alle Termine automatisch im Kalender auf Handy, Tablet und
          PC, und Änderungen kommen von selbst nach.
        </p>
      </header>

      <Suspense fallback={<p className="text-zinc-500">Lade Abo-Links …</p>}>
        <Feeds />
      </Suspense>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-bold">So geht’s</h2>
        <div className="space-y-1">
          <h3 className="font-semibold">📱 iPhone / iPad / Mac</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Auf <strong>„Apple Kalender“</strong> tippen und „Abonnieren“ bestätigen. Tipp: Unter
            Einstellungen → Kalender → Accounts → Abonnierte Kalender kann man „Aktualisieren: alle 15
            Minuten“ einstellen.
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">🤖 Android / Google Kalender</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Auf <strong>„Google Kalender“</strong> tippen – am besten am PC im Browser, weil die
            Google-App selbst keine Abos hinzufügen kann. Danach erscheint der Kalender automatisch
            auf dem Handy (in der Kalender-App ggf. unter „Synchronisieren“ einschalten).
          </p>
          <p className="rounded-md bg-orange-50 px-2 py-1 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200">
            Achtung: Google aktualisiert abonnierte Kalender nur ca. alle 8–24 Stunden. Kurzfristige
            Änderungen bitte immer hier auf der Seite prüfen.
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold">📧 Outlook</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Auf <strong>„Outlook“</strong> klicken (Outlook im Web) oder in Outlook am PC: Kalender →
            Kalender hinzufügen → Aus dem Internet → Link einfügen.
          </p>
        </div>
        <p className="text-sm text-zinc-500">
          Die Links sind persönlich und geheim – bitte nur innerhalb der Gruppe weitergeben.
        </p>
      </section>
    </div>
  );
}

async function Feeds() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const token = feedToken();

  return (
    <ul className="space-y-3">
      {(Object.keys(FILTER) as FilterName[]).map((f) => {
        const pfad = `${host}/kalender/${encodeURIComponent(token)}/${f}.ics`;
        const https = `${proto}://${pfad}`;
        const webcal = `webcal://${pfad}`;
        const name = f === "alle" ? "Prinzen-Kalender" : `Prinzen-Kalender – ${FILTER[f].label}`;
        return (
          <li
            key={f}
            className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <h2 className="font-semibold">{FILTER[f].label}</h2>
              <p className="text-sm text-zinc-500">{FILTER[f].beschreibung}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={webcal}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
              >
                📱 Apple Kalender
              </a>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
              >
                Google Kalender
              </a>
              <a
                href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
              >
                Outlook
              </a>
              <Kopieren text={https} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
