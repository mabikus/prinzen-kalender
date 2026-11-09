import Link from "next/link";
import { Suspense } from "react";
import { Orte, ProgrammKarte, TerminBadges, TerminZeile } from "@/components/termin";
import { ladeDaten } from "@/lib/daten";
import { filterListe } from "@/lib/labels";
import type { Termin } from "@/lib/types";
import { datumKurz, datumLang, jetztInBerlin, MONATE, zeitplan, zeitText } from "@/lib/zeit";

export default function Startseite({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Termine werden geladen …</p>}>
      <Agenda searchParams={searchParams} />
    </Suspense>
  );
}

async function Agenda({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const sp = await searchParams;
  const mitVergangenen = sp.vergangen === "1";

  const { termine: alle, gruppen } = await ladeDaten();
  const filterAuswahl = filterListe(gruppen);
  const aktiv = filterAuswahl.find((f) => f.key === sp.f) ?? filterAuswahl[0];
  const filter = aktiv.key;
  const plan = zeitplan(alle);
  const nachId = new Map(alle.map((t) => [t.id, t]));
  const jetzt = jetztInBerlin();

  const istVergangen = (t: Termin) => {
    if (t.datum !== jetzt.datum) return t.datum < jetzt.datum;
    const ende = plan.get(t.id)?.ende;
    return ende != null && ende < jetzt.minuten;
  };

  const gefiltert = alle.filter(aktiv.passt);
  const vergangenAnzahl = gefiltert.filter(istVergangen).length;
  const sichtbar = mitVergangenen ? gefiltert : gefiltert.filter((t) => !istVergangen(t));
  const naechster = gefiltert.find((t) => !istVergangen(t));
  const naechsterStart = naechster ? plan.get(naechster.id)?.start : null;

  // Gruppieren: Monat -> Tag
  const monate = new Map<string, Map<string, Termin[]>>();
  for (const t of sichtbar) {
    const m = t.datum.slice(0, 7);
    if (!monate.has(m)) monate.set(m, new Map());
    const tage = monate.get(m)!;
    if (!tage.has(t.datum)) tage.set(t.datum, []);
    tage.get(t.datum)!.push(t);
  }

  const link = (f: string, vergangen = mitVergangenen) => {
    const p = new URLSearchParams();
    if (f !== "alle") p.set("f", f);
    if (vergangen) p.set("vergangen", "1");
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="space-y-6">
      {naechster && (
        <section className="rounded-2xl bg-gradient-to-br from-red-700 to-red-900 p-5 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-200">
            Als Nächstes{naechster.datum === jetzt.datum ? " – heute" : ""}
          </p>
          <Link href={`/termin/${encodeURIComponent(naechster.id)}`} className="mt-1 block">
            <h2 className="text-2xl font-bold leading-tight">
              {naechster.tagesprogramm ? `${naechster.tagesprogramm}: ` : ""}
              {naechster.titel}
            </h2>
            <p className="mt-1 text-red-100">
              {datumLang(naechster.datum)}
              {naechsterStart != null && (
                <>
                  {" · "}
                  <strong className="text-white">
                    {naechster.treffzeit ? "Treffen " : ""}
                    {zeitText(naechsterStart)}
                  </strong>
                </>
              )}
            </p>
            <div className="mt-2 [&_p]:text-red-50">
              <Orte t={naechster} />
            </div>
            <div className="mt-3">
              <TerminBadges t={naechster} gruppen={gruppen} />
            </div>
          </Link>
        </section>
      )}

      <nav aria-label="Filter" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 whitespace-nowrap">
          {filterAuswahl.map(({ key: f, label, beschreibung }) => (
            <li key={f}>
              <Link
                href={link(f)}
                title={beschreibung}
                className={`inline-block rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                  f === filter
                    ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                    : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {vergangenAnzahl > 0 && (
        <p className="text-sm">
          <Link href={link(filter, !mitVergangenen)} className="text-red-700 underline dark:text-red-400">
            {mitVergangenen
              ? "Vergangene Termine ausblenden"
              : `${vergangenAnzahl} vergangene Termine anzeigen`}
          </Link>
        </p>
      )}

      {sichtbar.length === 0 && <p className="py-10 text-center text-zinc-500">Keine Termine.</p>}

      {[...monate].map(([monat, tage]) => {
        const [jahr, m] = monat.split("-").map(Number);
        return (
          <section key={monat} className="space-y-4">
            <h2 className="sticky top-14 z-10 -mx-4 bg-zinc-50/90 px-4 py-2 text-xl font-bold backdrop-blur dark:bg-zinc-950/90">
              {MONATE[m - 1]} {jahr}
            </h2>
            {[...tage].map(([datum, termine]) => (
              <div key={datum} id={datum} className="scroll-mt-28 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-500">
                  <span className={datum === jetzt.datum ? "text-red-700 dark:text-red-400" : ""}>
                    {datumKurz(datum)}
                    {datum === jetzt.datum && " · heute"}
                  </span>
                  {[...new Set(termine.map((t) => t.tagesprogramm))]
                    .filter((p): p is string => !!p && termine.filter((t) => t.tagesprogramm === p).length < ZUSAMMENKLAPPEN_AB)
                    .map((p) => (
                      <span
                        key={p}
                        className="ml-2 rounded bg-green-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                      >
                        {p}
                      </span>
                    ))}
                </h3>
                <div className="space-y-2">
                  {bloecke(termine).map((b) =>
                    b.programm ? (
                      <ProgrammKarte
                        key={`${datum}-${b.programm}`}
                        name={b.programm}
                        termine={b.termine}
                        plan={plan}
                        gruppen={gruppen}
                        nachId={nachId}
                        vergangen={istVergangen}
                        offen={datum === jetzt.datum}
                      />
                    ) : (
                      b.termine.map((t) => (
                        <TerminZeile
                          key={t.id}
                          t={t}
                          z={plan.get(t.id)}
                          gruppen={gruppen}
                          vorher={t.anschluss_an ? nachId.get(t.anschluss_an) : undefined}
                          vergangen={istVergangen(t)}
                        />
                      ))
                    ),
                  )}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** Ab so vielen Programmpunkten wird ein Tagesprogramm zusammengeklappt. */
const ZUSAMMENKLAPPEN_AB = 3;

/** Teilt die Termine eines Tages in Einzeltermine und Tagesprogramme. */
function bloecke(termine: Termin[]): { programm: string | null; termine: Termin[] }[] {
  const anzahl = new Map<string, number>();
  for (const t of termine) if (t.tagesprogramm) anzahl.set(t.tagesprogramm, (anzahl.get(t.tagesprogramm) ?? 0) + 1);

  const ergebnis: { programm: string | null; termine: Termin[] }[] = [];
  const programme = new Map<string, Termin[]>();
  for (const t of termine) {
    const p = t.tagesprogramm;
    if (p && (anzahl.get(p) ?? 0) >= ZUSAMMENKLAPPEN_AB) {
      if (!programme.has(p)) {
        programme.set(p, []);
        ergebnis.push({ programm: p, termine: programme.get(p)! });
      }
      programme.get(p)!.push(t);
    } else {
      ergebnis.push({ programm: null, termine: [t] });
    }
  }
  return ergebnis;
}
