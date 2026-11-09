import Link from "next/link";
import { Suspense } from "react";
import { TerminBadges, TerminZeile, Orte } from "@/components/termin";
import { FILTER, istFilter, KATEGORIE, type FilterName } from "@/lib/labels";
import { ladeTermine } from "@/lib/termine";
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
  const filter: FilterName = istFilter(sp.f) ? sp.f : "alle";
  const mitVergangenen = sp.vergangen === "1";

  const alle = await ladeTermine();
  const plan = zeitplan(alle);
  const nachId = new Map(alle.map((t) => [t.id, t]));
  const jetzt = jetztInBerlin();

  const istVergangen = (t: Termin) => {
    if (t.datum !== jetzt.datum) return t.datum < jetzt.datum;
    const ende = plan.get(t.id)?.ende;
    return ende != null && ende < jetzt.minuten;
  };

  const gefiltert = alle.filter(FILTER[filter].passt);
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

  const link = (f: FilterName, vergangen = mitVergangenen) => {
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
              {KATEGORIE[naechster.kategorie].icon} {naechster.titel}
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
              <TerminBadges t={naechster} />
            </div>
          </Link>
        </section>
      )}

      <nav aria-label="Filter" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2 whitespace-nowrap">
          {(Object.keys(FILTER) as FilterName[]).map((f) => (
            <li key={f}>
              <Link
                href={link(f)}
                title={FILTER[f].beschreibung}
                className={`inline-block rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                  f === filter
                    ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                    : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                }`}
              >
                {FILTER[f].label}
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
            {[...tage].map(([datum, termine]) => {
              const programme = [...new Set(termine.map((t) => t.tagesprogramm).filter(Boolean))];
              return (
                <div key={datum} id={datum} className="scroll-mt-28 space-y-2">
                  <h3 className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-zinc-500">
                    <span className={datum === jetzt.datum ? "text-red-700 dark:text-red-400" : ""}>
                      {datumKurz(datum)}
                      {datum === jetzt.datum && " · heute"}
                    </span>
                    {programme.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-green-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                      >
                        {p}
                      </span>
                    ))}
                  </h3>
                  <div className="space-y-2">
                    {termine.map((t) => (
                      <TerminZeile
                        key={t.id}
                        t={t}
                        z={plan.get(t.id)}
                        vorher={t.anschluss_an ? nachId.get(t.anschluss_an) : undefined}
                        vergangen={istVergangen(t)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
