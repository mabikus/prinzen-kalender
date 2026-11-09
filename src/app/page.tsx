import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { I, Orte, ProgrammKarte, TerminBadges, TerminZeile } from "@/components/termin";
import { ladeDaten } from "@/lib/daten";
import { filterListe } from "@/lib/labels";
import type { Termin } from "@/lib/types";
import { datumKurz, datumLang, jetztInBerlin, MONATE, zeitplan, zeitText } from "@/lib/zeit";

export default function Startseite({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Termine werden geladen …</p>}>
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
        <section className="overflow-hidden rounded-lg border border-linie bg-white shadow-[0_1px_3px_rgba(31,26,23,0.06)]">
          <p className="bg-marke-700 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
            Als Nächstes{naechster.datum === jetzt.datum ? " · heute" : ""}
          </p>
          <Link
            href={`/termin/${encodeURIComponent(naechster.id)}`}
            className="group flex items-start gap-5 p-5 hover:bg-papier"
          >
            {naechsterStart != null && (
              <div className="shrink-0 border-r border-linie pr-5 text-center">
                <div className="font-serif lining-nums text-4xl font-semibold tabular-nums leading-none text-marke-700">
                  {zeitText(naechsterStart)}
                </div>
                <div className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-grau">
                  {naechster.treffzeit ? "Treffen" : "Beginn"}
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="font-serif lining-nums text-2xl font-semibold leading-tight group-hover:text-marke-700">
                {naechster.tagesprogramm ? `${naechster.tagesprogramm}: ` : ""}
                {naechster.titel}
              </h2>
              <p className="text-sm text-tinte/80">{datumLang(naechster.datum)}</p>
              <Orte t={naechster} />
              <TerminBadges t={naechster} gruppen={gruppen} />
            </div>
            <I icon={ArrowRight} className="mt-2 size-5 text-grau group-hover:text-marke-700" />
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
                className={`inline-block rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                  f === filter
                    ? "bg-marke-700 text-white ring-marke-700"
                    : "bg-white text-tinte/80 ring-linie hover:ring-marke-300 hover:text-marke-700"
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
          <Link href={link(filter, !mitVergangenen)} className="text-marke-700 underline underline-offset-2">
            {mitVergangenen
              ? "Vergangene Termine ausblenden"
              : `${vergangenAnzahl} vergangene Termine anzeigen`}
          </Link>
        </p>
      )}

      {sichtbar.length === 0 && <p className="py-10 text-center text-grau">Keine Termine.</p>}

      {[...monate].map(([monat, tage]) => {
        const [jahr, m] = monat.split("-").map(Number);
        return (
          <section key={monat} className="space-y-4">
            <h2 className="sticky top-[59px] z-10 -mx-4 flex items-baseline gap-3 bg-papier/95 px-4 py-2.5 backdrop-blur">
              <span className="font-serif lining-nums text-2xl font-semibold text-marke-800">{MONATE[m - 1]}</span>
              <span className="text-sm text-grau">{jahr}</span>
              <span className="h-px flex-1 self-center bg-linie" aria-hidden />
            </h2>
            {[...tage].map(([datum, termine]) => (
              <div key={datum} id={datum} className="scroll-mt-28 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-grau">
                  <span className={datum === jetzt.datum ? "text-marke-700" : ""}>
                    {datumKurz(datum)}
                    {datum === jetzt.datum && " · heute"}
                  </span>
                  {[...new Set(termine.map((t) => t.tagesprogramm))]
                    .filter((p): p is string => !!p && termine.filter((t) => t.tagesprogramm === p).length < ZUSAMMENKLAPPEN_AB)
                    .map((p) => (
                      <span
                        key={p}
                        className="ml-2 text-marke-700"
                      >
                        · {p}
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
