import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { I, TerminZeile } from "@/components/termin";
import { ladeDaten } from "@/lib/daten";
import type { Termin } from "@/lib/types";
import { datumLang, jetztInBerlin, MONATE, zeitplan, zeitText } from "@/lib/zeit";

export const metadata = { title: "Monat" };

export default function MonatSeite({ searchParams }: PageProps<"/monat">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade Monat …</p>}>
      <Monat searchParams={searchParams} />
    </Suspense>
  );
}

function monatPlus(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

const WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/** Rot-Weiß-Abstufung: Alle = rot, Auswahl = hellrot, Jeder Verfügbare = grau */
const STIL = {
  alle: { chip: "bg-marke-700 text-white", punkt: "bg-marke-700", label: "Alle" },
  auswahl: { chip: "bg-marke-50 text-marke-900 ring-1 ring-inset ring-marke-200", punkt: "bg-marke-300", label: "Auswahl" },
  jeder_verfuegbare: { chip: "bg-stone-100 text-stone-700", punkt: "bg-stone-400", label: "Jeder Verfügbare" },
} as const;

const PFEIL =
  "flex size-11 items-center justify-center rounded-[12px] bg-white text-grau ring-1 ring-linie active:bg-papier hover:text-marke-700 hover:ring-marke-300";

async function Monat({ searchParams }: Pick<PageProps<"/monat">, "searchParams">) {
  const sp = await searchParams;
  const { termine: alle, gruppen } = await ladeDaten(); // vor new Date() – wartet auf die Anfrage
  const jetzt = jetztInBerlin();
  const ym = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : jetzt.datum.slice(0, 7);
  const [jahr, monat] = ym.split("-").map(Number);

  const plan = zeitplan(alle);
  const proTag = new Map<string, Termin[]>();
  for (const t of alle) {
    if (!t.datum.startsWith(ym)) continue;
    if (!proTag.has(t.datum)) proTag.set(t.datum, []);
    proTag.get(t.datum)!.push(t);
  }

  // Ausgewählter Tag: aus der Adresse, sonst heute (falls in diesem Monat), sonst erster Tag mit Terminen
  const ersterMitTerminen = [...proTag.keys()].sort()[0] ?? null;
  const gewaehlt =
    typeof sp.tag === "string" && sp.tag.startsWith(ym) && /^\d{4}-\d{2}-\d{2}$/.test(sp.tag)
      ? sp.tag
      : jetzt.datum.startsWith(ym)
        ? jetzt.datum
        : ersterMitTerminen;
  const amTag = gewaehlt ? (proTag.get(gewaehlt) ?? []) : [];
  const nachId = new Map(alle.map((t) => [t.id, t]));

  const tageImMonat = new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
  const ersterWochentag = (new Date(Date.UTC(jahr, monat - 1, 1)).getUTCDay() + 6) % 7; // Mo = 0
  const zellen: (number | null)[] = [
    ...Array(ersterWochentag).fill(null),
    ...Array.from({ length: tageImMonat }, (_, i) => i + 1),
  ];
  while (zellen.length % 7) zellen.push(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href={`/monat?m=${monatPlus(ym, -1)}`} className={PFEIL} aria-label="Vorheriger Monat">
          <I icon={ChevronLeft} className="size-5" />
        </Link>
        <h1 className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-semibold text-marke-800">{MONATE[monat - 1]}</span>
          <span className="text-grau">{jahr}</span>
        </h1>
        <Link href={`/monat?m=${monatPlus(ym, 1)}`} className={PFEIL} aria-label="Nächster Monat">
          <I icon={ChevronRight} className="size-5" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[14px] border border-linie bg-linie">
        {WT.map((w, i) => (
          <div
            key={w}
            className={`bg-white py-2 text-center text-[11px] font-semibold uppercase tracking-wider ${
              i >= 5 ? "text-marke-700" : "text-grau"
            }`}
          >
            {w}
          </div>
        ))}
        {zellen.map((tag, i) => {
          if (tag === null) return <div key={i} className="min-h-[60px] bg-papier sm:min-h-24" />;
          const datum = `${ym}-${String(tag).padStart(2, "0")}`;
          const termine = proTag.get(datum) ?? [];
          const heute = datum === jetzt.datum;
          const istGewaehlt = datum === gewaehlt;
          return (
            <Link
              key={i}
              href={`/monat?m=${ym}&tag=${datum}`}
              scroll={false}
              aria-label={`${datumLang(datum)}, ${termine.length} Termine`}
              aria-current={istGewaehlt ? "date" : undefined}
              className={`flex min-h-[60px] flex-col items-center gap-1 px-0.5 pb-1.5 pt-1.5 sm:min-h-24 sm:items-stretch sm:px-1 ${
                istGewaehlt ? "bg-marke-50" : "bg-white active:bg-papier"
              }`}
            >
              <span className="flex sm:justify-end">
                <span
                  className={`grid size-8 place-items-center rounded-full text-[15px] tabular-nums ${
                    istGewaehlt
                      ? "bg-marke-700 font-semibold text-white"
                      : heute
                        ? "font-semibold text-marke-700 ring-1 ring-inset ring-marke-300"
                        : "text-tinte"
                  }`}
                >
                  {tag}
                </span>
              </span>
              {/* Handy: Punkte */}
              <span className="flex flex-wrap justify-center gap-[3px] sm:hidden">
                {termine.slice(0, 4).map((t) => (
                  <span key={t.id} className={`size-[6px] rounded-full ${STIL[t.umfang].punkt}`} />
                ))}
              </span>
              {/* größer: Einträge */}
              <span className="hidden space-y-0.5 sm:block">
                {termine.slice(0, 4).map((t) => {
                  const start = plan.get(t.id)?.start;
                  return (
                    <span
                      key={t.id}
                      className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs leading-tight ${STIL[t.umfang].chip} ${
                        t.status === "vorbehalt" ? "opacity-60" : ""
                      }`}
                    >
                      {start != null && <span className="tabular-nums opacity-80">{zeitText(start)}</span>}
                      {t.anmeldung && <I icon={Ticket} className="size-3" />}
                      <span className="truncate">{t.titel}</span>
                    </span>
                  );
                })}
                {termine.length > 4 ? <span className="block px-1 text-xs text-grau">+ {termine.length - 4} weitere</span> : null}
              </span>
            </Link>
          );
        })}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[13px] text-grau">
        {Object.values(STIL).map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${s.punkt}`} />
            {s.label}
          </li>
        ))}
      </ul>

      {/* Termine des ausgewählten Tages */}
      {gewaehlt ? (
        <section className="space-y-2.5" aria-live="polite">
          <h2 className="flex items-baseline justify-between px-1">
            <span className="font-serif text-[22px] font-semibold text-marke-800">{datumLang(gewaehlt)}</span>
            {gewaehlt === jetzt.datum ? <span className="text-[13px] font-semibold uppercase tracking-wider text-marke-700">heute</span> : null}
          </h2>
          {amTag.length ? (
            <div className="space-y-2">
              {amTag.map((t) => (
                <TerminZeile
                  key={t.id}
                  t={t}
                  z={plan.get(t.id)}
                  gruppen={gruppen}
                  vorher={t.anschluss_an ? nachId.get(t.anschluss_an) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-[14px] border border-linie bg-white px-4 py-5 text-center text-[16px] text-grau">Keine Termine an diesem Tag.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
