import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GruppenBadges } from "@/components/termin";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten } from "@/lib/daten";
import { ANMELDUNG, ART, personenBedarf, STATUS, UMFANG } from "@/lib/labels";
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
  const daten = await ladeDaten();
  const t = daten.termine.find((x) => x.id === decodeURIComponent(id));
  if (!t) notFound();

  const z = zeitplan(daten.termine).get(t.id);
  const vorher = t.anschluss_an ? daten.termine.find((x) => x.id === t.anschluss_an) : undefined;
  const geschaetzt = !t.ende && z?.ende != null;
  const bedarf = personenBedarf(t, daten.gruppen);
  const bearbeiten = await darfBearbeiten();

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/#${t.datum}`} className="text-sm text-zinc-500 hover:underline">
          ← Zurück zur Übersicht
        </Link>
        {bearbeiten && (
          <Link
            href={`/verwaltung/termin/${encodeURIComponent(t.id)}`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-300 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800"
          >
            ✏️ Bearbeiten
          </Link>
        )}
      </div>

      <header className="space-y-2">
        <p className="text-sm font-medium text-zinc-500">
          {ART[t.art]}
          {t.tagesprogramm && ` · ${t.tagesprogramm}`}
        </p>
        <h1 className="text-3xl font-bold leading-tight">{t.titel}</h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">{datumLang(t.datum)}</p>
        <p
          className={`inline-block rounded-md px-2 py-1 text-sm font-medium ${
            t.status === "vorbehalt"
              ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100"
              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
          }`}
        >
          {t.status === "vorbehalt" ? "⏳" : "✓"} {STATUS[t.status]}
        </p>
      </header>

      {t.hinweis && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          ⚠️ {t.hinweis}
        </p>
      )}

      {t.anmeldung && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <h2 className="font-semibold text-amber-900 dark:text-amber-100">
            {ANMELDUNG[t.anmeldung].icon} {ANMELDUNG[t.anmeldung].label}
          </h2>
          <p className="mt-1 text-amber-900 dark:text-amber-100">
            Bedarf: <strong className="text-xl tabular-nums">{bedarf.summe}</strong> Personen
            {t.karten_bestellt != null && (
              <>
                {" · "}bestellt: <strong className="tabular-nums">{t.karten_bestellt}</strong>
              </>
            )}
          </p>
          <ul className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
            {bedarf.dabei.map((g) => (
              <li key={g.id}>
                {g.name}: {g.personen ?? "Anzahl fehlt"}
              </li>
            ))}
          </ul>
          {bedarf.ohneAngabe.length > 0 && (
            <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-100/80">
              Für {bedarf.ohneAngabe.map((g) => g.name).join(", ")} ist noch keine Personenzahl hinterlegt
              (Verwaltung → Gruppen).
            </p>
          )}
        </section>
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
        <Zeile label="Wer">
          <div className="flex flex-wrap gap-1.5">
            <GruppenBadges t={t} gruppen={daten.gruppen} />
          </div>
          {t.umfang !== "auswahl" && (
            <p className="mt-1 text-sm text-zinc-500">{UMFANG[t.umfang].beschreibung}</p>
          )}
        </Zeile>
        {t.bemerkung && <Zeile label="Bemerkung">{t.bemerkung}</Zeile>}
        <Zeile label="Quelle">
          <span className="text-sm text-zinc-500">
            {t.quelle.map((q) => (q === "kg" ? "KG-Terminplan" : q === "eigen" ? "eigene Liste" : q)).join(" + ") || "–"}
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
