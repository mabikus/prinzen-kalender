import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, CircleHelp, Clock, Lock, LogOut, Plus, Ticket, TriangleAlert, Users } from "lucide-react";
import { ANMELDUNG_ICON, GruppenBadges, I } from "@/components/termin";
import { bearbeitenToken, darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { datumKurz, jetztInBerlin, startzeit } from "@/lib/zeit";
import { abmelden, anmelden } from "./aktionen";

export const metadata = { title: "Verwaltung" };

export default function Seite({ searchParams }: PageProps<"/verwaltung">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade …</p>}>
      <Verwaltung searchParams={searchParams} />
    </Suspense>
  );
}

const KNOPF = "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ring-1 ring-inset transition";

async function Verwaltung({ searchParams }: Pick<PageProps<"/verwaltung">, "searchParams">) {
  const sp = await searchParams;

  if (!(await darfBearbeiten())) {
    return (
      <form action={anmelden} className="mx-auto max-w-sm space-y-4 py-12">
        <span className="flex size-12 items-center justify-center rounded-full bg-marke-50 text-marke-700">
          <I icon={Lock} className="size-5" />
        </span>
        <h1 className="font-serif lining-nums text-3xl font-semibold">Verwaltung</h1>
        <p className="text-grau">Zum Bearbeiten bitte das Passwort eingeben.</p>
        {sp.fehler === "passwort" && <p className="text-sm font-medium text-marke-700">Passwort falsch.</p>}
        <input
          type="password"
          name="passwort"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-linie bg-white px-3 py-2.5 outline-none focus:border-marke-300 focus:ring-2 focus:ring-marke-100"
        />
        <button type="submit" className={`${KNOPF} w-full justify-center bg-marke-700 text-white ring-marke-700 hover:bg-marke-800`}>
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
      <header className="flex items-end justify-between border-b border-linie pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">Pflege</p>
          <h1 className="font-serif lining-nums text-4xl font-semibold">Verwaltung</h1>
        </div>
        {bearbeitenToken() && (
          <form action={abmelden}>
            <button className="inline-flex items-center gap-1.5 text-sm text-grau hover:text-marke-700">
              <I icon={LogOut} className="size-4" />
              Abmelden
            </button>
          </form>
        )}
      </header>

      {moeglich !== true && (
        <p className="flex items-start gap-2 rounded-lg border border-marke-200 bg-marke-50 p-3.5 text-sm text-marke-800">
          <I icon={TriangleAlert} className="mt-0.5 size-4" />
          {moeglich}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/verwaltung/termin/neu" className={`${KNOPF} bg-marke-700 text-white ring-marke-700 hover:bg-marke-800`}>
          <I icon={Plus} className="size-4" />
          Neuer Termin
        </Link>
        <Link
          href="/verwaltung/gruppen"
          className={`${KNOPF} bg-white text-tinte ring-linie hover:text-marke-700 hover:ring-marke-300`}
        >
          <I icon={Users} className="size-4" />
          Gruppen ({daten.gruppen.length})
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kennzahl icon={CircleHelp} zahl={offen} text="offene Prüf-Hinweise" />
        <Kennzahl icon={Ticket} zahl={karten} text="Karten/Anmeldung noch nicht bestellt" />
      </div>

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-grau">Termine</h2>
          <Link
            href={zeigeAlle ? "/verwaltung" : "/verwaltung?alle=1"}
            className="text-sm text-marke-700 underline underline-offset-2"
          >
            {zeigeAlle ? "nur kommende" : "auch vergangene"}
          </Link>
        </div>
        <ul className="divide-y divide-linie overflow-hidden rounded-lg border border-linie bg-white">
          {liste.map((t) => (
            <li key={t.id}>
              <Link
                href={`/verwaltung/termin/${encodeURIComponent(t.id)}`}
                className="group flex items-start gap-3 px-3.5 py-2.5 hover:bg-papier"
              >
                <span className="w-24 shrink-0 pt-0.5 text-sm tabular-nums text-grau">
                  {datumKurz(t.datum)} {startzeit(t) ?? ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-medium group-hover:text-marke-700">
                    {t.status === "vorbehalt" && <I icon={Clock} className="size-3.5 text-grau" />}
                    {t.anmeldung && <I icon={ANMELDUNG_ICON[t.anmeldung]} className="size-3.5 text-marke-700" />}
                    <span className="truncate">
                      {t.tagesprogramm && <span className="text-grau">{t.tagesprogramm}: </span>}
                      {t.titel}
                    </span>
                    {t.pruefen && (
                      <span title={t.pruefen}>
                        <I icon={CircleHelp} className="size-3.5 text-grau" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <GruppenBadges t={t} gruppen={daten.gruppen} />
                  </span>
                </span>
                <I icon={ChevronRight} className="mt-0.5 size-4 text-grau" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kennzahl({ icon, zahl, text }: { icon: typeof Ticket; zahl: number; text: string }) {
  return (
    <div className="rounded-lg border border-linie bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif lining-nums text-3xl font-semibold tabular-nums text-marke-700">{zahl}</span>
        <I icon={icon} className="size-5 text-grau" />
      </div>
      <p className="mt-1 text-sm text-grau">{text}</p>
    </div>
  );
}
