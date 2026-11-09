import { Suspense } from "react";
import { CalendarPlus, Mail, MonitorSmartphone, Smartphone, TriangleAlert, type LucideIcon } from "lucide-react";
import { Kopieren } from "@/components/kopieren";
import { I } from "@/components/termin";
import { basisUrl } from "@/lib/auth";
import { ladeDatenZwischengespeichert } from "@/lib/daten";
import { filterListe, type Filter } from "@/lib/labels";
import { feedToken } from "@/lib/zugang";
import { ladeMarke } from "@/lib/marke-laden";

export const metadata = { title: "Kalender-Abo" };

export default function AboSeite() {
  return (
    <div className="space-y-8">
      <header className="space-y-2 border-b border-linie pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">Kalender-Abo</p>
        <h1 className="font-serif lining-nums text-4xl font-semibold">Termine abonnieren</h1>
        <p className="text-tinte/80">
          Einmal abonnieren, dann erscheinen alle Termine automatisch im Kalender auf Handy, Tablet und PC. Änderungen
          kommen von selbst nach.
        </p>
      </header>

      <Suspense fallback={<div aria-hidden className="h-[300px] animate-pulse rounded-lg bg-stone-200/40" />}>
        <Feeds />
      </Suspense>

      <section className="space-y-5 rounded-lg border border-linie bg-panel p-5">
        <h2 className="font-serif lining-nums text-2xl font-semibold">So geht’s</h2>
        <Anleitung icon={Smartphone} titel="iPhone, iPad, Mac">
          Auf <strong>Apple</strong> tippen und „Abonnieren“ bestätigen. Tipp: Unter Einstellungen → Kalender → Accounts
          → Abonnierte Kalender lässt sich „Aktualisieren: alle 15 Minuten“ einstellen.
        </Anleitung>
        <Anleitung icon={MonitorSmartphone} titel="Android, Google Kalender">
          Auf <strong>Google</strong> tippen, am besten am PC im Browser, denn die Google-App selbst kann keine Abos
          hinzufügen. Danach erscheint der Kalender automatisch auf dem Handy (in der Kalender-App ggf. unter
          „Synchronisieren“ einschalten).
          <span className="mt-2 flex items-start gap-1.5 text-marke-700">
            <I icon={TriangleAlert} className="mt-0.5 size-4" />
            Google aktualisiert abonnierte Kalender nur etwa alle 8–24 Stunden. Kurzfristige Änderungen bitte hier auf
            der Seite prüfen.
          </span>
        </Anleitung>
        <Anleitung icon={Mail} titel="Outlook">
          Auf <strong>Outlook</strong> klicken (Outlook im Web) oder in Outlook am PC: Kalender → Kalender hinzufügen →
          Aus dem Internet → Link einfügen.
        </Anleitung>
        <p className="border-t border-linie pt-4 text-sm text-grau">
          Die Links sind persönlich und geheim – bitte nur innerhalb der Gruppe weitergeben.
        </p>
      </section>
    </div>
  );
}

function Anleitung({ icon, titel, children }: { icon: LucideIcon; titel: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-marke-50 text-marke-700">
        <I icon={icon} className="size-[18px]" />
      </span>
      <div className="space-y-1">
        <h3 className="font-semibold">{titel}</h3>
        <p className="text-sm text-tinte/75">{children}</p>
      </div>
    </div>
  );
}

const KNOPF =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition";

function Knoepfe({ f, host, proto, token, haupt, appName }: { f: Filter; host: string; proto: string; token: string; haupt?: boolean; appName: string }) {
  const pfad = `${host}/kalender/${encodeURIComponent(token)}/${f.key}.ics`;
  const https = `${proto}://${pfad}`;
  const webcal = `webcal://${pfad}`;
  const name = f.key === "alle" ? appName : `${appName} – ${f.label}`;
  const zweit = `${KNOPF} bg-panel text-tinte ring-linie hover:text-marke-700 hover:ring-marke-300`;
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={webcal}
        className={haupt ? `${KNOPF} bg-marke-700 text-white ring-marke-700 hover:brightness-95` : zweit}
      >
        <I icon={CalendarPlus} className="size-4" />
        Apple
      </a>
      <a
        href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
        target="_blank"
        rel="noreferrer"
        className={zweit}
      >
        Google
      </a>
      <a
        href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`}
        target="_blank"
        rel="noreferrer"
        className={zweit}
      >
        Outlook
      </a>
      <Kopieren text={https} />
    </div>
  );
}

function Liste({
  titel,
  feeds,
  host,
  proto,
  token,
  appName,
}: {
  titel: string;
  feeds: Filter[];
  host: string;
  proto: string;
  token: string;
  appName: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-grau">{titel}</h2>
      <ul className="divide-y divide-linie overflow-hidden rounded-lg border border-linie bg-panel">
        {feeds.map((f) => (
          <li key={f.key} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">{f.label}</h3>
              <p className="text-sm text-grau">{f.beschreibung}</p>
            </div>
            <Knoepfe f={f} host={host} proto={proto} token={token} appName={appName} />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function Feeds() {
  // Adresse aus der Konfiguration (Hauptdomain) statt aus der Anfrage – so ist der Tab vorbereitet
  const basis = new URL(basisUrl());
  const host = basis.host;
  const proto = basis.protocol.replace(":", "");
  const token = feedToken();
  const [{ gruppen }, marke] = await Promise.all([ladeDatenZwischengespeichert(), ladeMarke()]);
  const [alle, ...weitere] = filterListe(gruppen);
  const gruppenFeeds = weitere.filter((f) => gruppen.some((g) => g.id === f.key));
  const sonstige = weitere.filter((f) => !gruppen.some((g) => g.id === f.key));

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-lg border-l-[3px] border-marke-700 bg-panel p-5 shadow-[0_1px_3px_rgba(31,26,23,0.06)]">
        <div>
          <h2 className="font-serif lining-nums text-2xl font-semibold">Alle Termine</h2>
          <p className="text-sm text-grau">Der komplette Plan der Session – für Prinz und Adjutanten.</p>
        </div>
        <Knoepfe f={alle} host={host} proto={proto} token={token} haupt appName={marke.name} />
      </section>
      <Liste titel="Nur für eine Gruppe" feeds={gruppenFeeds} host={host} proto={proto} token={token} appName={marke.name} />
      <Liste titel="Weitere" feeds={sonstige} host={host} proto={proto} token={token} appName={marke.name} />
    </div>
  );
}
