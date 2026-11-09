import Link from "next/link";
import { Suspense } from "react";
import { GruppenBadges } from "@/components/termin";
import { bearbeitenToken, darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { ANMELDUNG } from "@/lib/labels";
import { datumKurz, jetztInBerlin, startzeit } from "@/lib/zeit";
import { abmelden, anmelden } from "./aktionen";

export const metadata = { title: "Verwaltung" };

export default function Seite({ searchParams }: PageProps<"/verwaltung">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Lade …</p>}>
      <Verwaltung searchParams={searchParams} />
    </Suspense>
  );
}

const KNOPF =
  "rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-zinc-300 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800";

async function Verwaltung({ searchParams }: Pick<PageProps<"/verwaltung">, "searchParams">) {
  const sp = await searchParams;

  if (!(await darfBearbeiten())) {
    return (
      <form action={anmelden} className="mx-auto max-w-sm space-y-4 py-10">
        <h1 className="text-2xl font-bold">Verwaltung</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Zum Bearbeiten bitte das Passwort eingeben.</p>
        {sp.fehler === "passwort" && <p className="text-sm font-medium text-red-700">Passwort falsch.</p>}
        <input
          type="password"
          name="passwort"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button type="submit" className="w-full rounded-xl bg-red-700 px-4 py-2.5 font-semibold text-white">
          Anmelden
        </button>
      </form>
    );
  }

  const daten = await ladeDaten();
  const moeglich = speichernMoeglich();
  const heute = jetztInBerlin().datum;
  const zeigeAlle = sp.alle === "1";
  const liste = zeigeAlle ? daten.termine : daten.termine.filter((t) => t.datum >= heute);
  const offen = daten.termine.filter((t) => t.pruefen && t.datum >= heute).length;
  const karten = daten.termine.filter((t) => t.anmeldung && t.datum >= heute && t.karten_bestellt == null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verwaltung</h1>
        {bearbeitenToken() && (
          <form action={abmelden}>
            <button className="text-sm text-zinc-500 underline">Abmelden</button>
          </form>
        )}
      </div>

      {moeglich !== true && (
        <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200">
          {moeglich}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/verwaltung/termin/neu" className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white">
          + Neuer Termin
        </Link>
        <Link href="/verwaltung/gruppen" className={KNOPF}>
          👥 Gruppen ({daten.gruppen.length})
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-orange-50 p-3 text-orange-900 dark:bg-orange-950 dark:text-orange-200">
          <div className="text-2xl font-bold tabular-nums">{offen}</div>
          offene Prüf-Hinweise
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <div className="text-2xl font-bold tabular-nums">{karten}</div>
          Termine mit Karten/Anmeldung, noch nichts bestellt
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Termine</h2>
          <Link href={zeigeAlle ? "/verwaltung" : "/verwaltung?alle=1"} className="text-sm text-red-700 underline dark:text-red-400">
            {zeigeAlle ? "nur kommende" : "auch vergangene"}
          </Link>
        </div>
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {liste.map((t) => (
            <li key={t.id}>
              <Link
                href={`/verwaltung/termin/${encodeURIComponent(t.id)}`}
                className="flex items-start gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <span className="w-24 shrink-0 text-sm tabular-nums text-zinc-500">
                  {datumKurz(t.datum)} {startzeit(t) ?? ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {t.status === "vorbehalt" && <span className="text-yellow-600">⏳ </span>}
                    {t.anmeldung && `${ANMELDUNG[t.anmeldung].icon} `}
                    {t.tagesprogramm && <span className="text-zinc-500">{t.tagesprogramm}: </span>}
                    {t.titel}
                    {t.pruefen && <span title={t.pruefen}> 🔎</span>}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <GruppenBadges t={t} gruppen={daten.gruppen} />
                  </span>
                </span>
                <span className="text-zinc-400">✏️</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
