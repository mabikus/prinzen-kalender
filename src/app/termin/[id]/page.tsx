import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BesetzungBadge } from "@/components/termin";
import { BESETZUNG, FAHRT, KATEGORIE, STATUS } from "@/lib/labels";
import { ladeTermine } from "@/lib/termine";
import { datumLang, zeitplan, zeitText } from "@/lib/zeit";

export default function TerminSeite({ params }: PageProps<"/termin/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Lade Termin …</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

/** Link zur Kartensuche – funktioniert auf iPhone, Android und am PC. */
function karte(ort: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ort}, Kreis Ahrweiler`)}`;
}

function Zeile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Ort({ name }: { name: string }) {
  if (name === "im Anschluss") return <>{name}</>;
  return (
    <a href={karte(name)} target="_blank" rel="noreferrer" className="text-red-700 underline dark:text-red-400">
      {name} ↗
    </a>
  );
}

async function Detail({ params }: Pick<PageProps<"/termin/[id]">, "params">) {
  const { id } = await params;
  const alle = await ladeTermine();
  const t = alle.find((x) => x.id === decodeURIComponent(id));
  if (!t) notFound();

  const z = zeitplan(alle).get(t.id);
  const vorher = t.anschluss_an ? alle.find((x) => x.id === t.anschluss_an) : undefined;
  const geschaetzt = !t.ende && z?.ende != null;

  return (
    <article className="space-y-6">
      <p>
        <Link href={`/#${t.datum}`} className="text-sm text-zinc-500 hover:underline">
          ← Zurück zur Übersicht
        </Link>
      </p>

      <header className="space-y-2">
        <p className="text-sm font-medium text-zinc-500">
          {KATEGORIE[t.kategorie].icon} {KATEGORIE[t.kategorie].label}
          {t.tagesprogramm && ` · ${t.tagesprogramm}`}
        </p>
        <h1 className="text-3xl font-bold leading-tight">{t.titel}</h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">{datumLang(t.datum)}</p>
        {t.status === "vorbehalt" && (
          <p className="inline-block rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100">
            Status: {STATUS.vorbehalt}
          </p>
        )}
      </header>

      {t.hinweis && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          ⚠️ {t.hinweis}
        </p>
      )}

      <dl className="rounded-2xl border border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        {(t.treffzeit || t.treffpunkt) && (
          <Zeile label="Treffen">
            <span className="font-semibold tabular-nums">{t.treffzeit}</span>
            {t.treffzeit && t.treffpunkt && " · "}
            {t.treffpunkt && <Ort name={t.treffpunkt} />}
          </Zeile>
        )}
        {vorher && (
          <Zeile label="Zeit">
            im Anschluss an{" "}
            <Link href={`/termin/${encodeURIComponent(vorher.id)}`} className="underline">
              {vorher.titel}
            </Link>
            {z?.start != null && <span className="text-zinc-500"> (ca. {zeitText(z.start)})</span>}
          </Zeile>
        )}
        {t.einlass && (
          <Zeile label="Einlass">
            <span className="tabular-nums">{t.einlass}</span>
          </Zeile>
        )}
        {(t.beginn || t.ort) && (
          <Zeile label="Beginn">
            <span className="font-semibold tabular-nums">{t.beginn}</span>
            {t.beginn && t.ort && " · "}
            {t.ort && <Ort name={t.ort} />}
          </Zeile>
        )}
        {z?.ende != null && (
          <Zeile label="Ende">
            <span className="tabular-nums">
              {geschaetzt && "ca. "}
              {zeitText(z.ende)}
            </span>
            {geschaetzt && <span className="text-sm text-zinc-500"> (geschätzt)</span>}
          </Zeile>
        )}
        {z?.ganztags && (
          <Zeile label="Uhrzeit">
            <span className="text-zinc-500">noch offen</span>
          </Zeile>
        )}
        {t.veranstalter && <Zeile label="Veranstalter">{t.veranstalter}</Zeile>}
        <Zeile label="Besetzung">
          <BesetzungBadge t={t} />
          <p className="mt-1 text-sm text-zinc-500">{BESETZUNG[t.besetzung].beschreibung}</p>
        </Zeile>
        <Zeile label="Familie">{t.familie ? "👨‍👩‍👧 Frau & Kinder dabei" : "–"}</Zeile>
        <Zeile label="Fahrt">
          {FAHRT[t.fahrt].icon} {FAHRT[t.fahrt].label}
          {t.fahrt_details && <p className="text-sm">{t.fahrt_details}</p>}
          {t.fahrer && <p className="text-sm text-zinc-500">Fahrer: {t.fahrer}</p>}
        </Zeile>
        {t.bemerkung && <Zeile label="Bemerkung">{t.bemerkung}</Zeile>}
        <Zeile label="Quelle">
          <span className="text-sm text-zinc-500">
            {t.quelle.map((q) => (q === "kg" ? "KG-Terminplan" : "eigene Liste")).join(" + ")}
          </span>
        </Zeile>
      </dl>

      {t.pruefen && (
        <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200">
          🔎 <strong>Noch prüfen:</strong> {t.pruefen}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`/termin/${encodeURIComponent(t.id)}/ics`}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          📅 In meinen Kalender
        </a>
        {t.treffpunkt && t.treffpunkt !== "im Anschluss" && (
          <a
            href={karte(t.treffpunkt)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:ring-zinc-700"
          >
            🧭 Navigation zum Treffpunkt
          </a>
        )}
      </div>
    </article>
  );
}
