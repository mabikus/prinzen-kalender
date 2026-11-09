import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { I } from "@/components/termin";
import { ladeDaten } from "@/lib/daten";
import type { Termin } from "@/lib/types";
import { datumKurz, jetztInBerlin, MONATE, zeitplan, zeitText } from "@/lib/zeit";

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
  "flex size-9 items-center justify-center rounded-md bg-white text-grau ring-1 ring-linie hover:text-marke-700 hover:ring-marke-300";

async function Monat({ searchParams }: Pick<PageProps<"/monat">, "searchParams">) {
  const sp = await searchParams;
  const { termine: alle } = await ladeDaten(); // vor new Date() – wartet auf die Anfrage
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
          <span className="font-serif lining-nums text-3xl font-semibold text-marke-800">{MONATE[monat - 1]}</span>
          <span className="text-grau">{jahr}</span>
        </h1>
        <Link href={`/monat?m=${monatPlus(ym, 1)}`} className={PFEIL} aria-label="Nächster Monat">
          <I icon={ChevronRight} className="size-5" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-linie bg-linie text-xs">
        {WT.map((w, i) => (
          <div
            key={w}
            className={`bg-white py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider ${
              i >= 5 ? "text-marke-700" : "text-grau"
            }`}
          >
            {w}
          </div>
        ))}
        {zellen.map((tag, i) => {
          if (tag === null) return <div key={i} className="min-h-16 bg-papier sm:min-h-24" />;
          const datum = `${ym}-${String(tag).padStart(2, "0")}`;
          const termine = proTag.get(datum) ?? [];
          const heute = datum === jetzt.datum;
          return (
            <div key={i} className={`min-h-16 space-y-0.5 p-1 sm:min-h-24 ${heute ? "bg-marke-50" : "bg-white"}`}>
              <div className="flex justify-end">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${
                    heute ? "bg-marke-700 font-semibold text-white" : "text-grau"
                  }`}
                >
                  {tag}
                </span>
              </div>
              {/* Handy: nur Punkte */}
              <div className="flex flex-wrap gap-1 px-0.5 sm:hidden">
                {termine.map((t) => (
                  <span key={t.id} className={`size-1.5 rounded-full ${STIL[t.umfang].punkt}`} />
                ))}
              </div>
              {/* größer: Einträge */}
              <div className="hidden space-y-0.5 sm:block">
                {termine.map((t) => {
                  const start = plan.get(t.id)?.start;
                  return (
                    <Link
                      key={t.id}
                      href={`/termin/${encodeURIComponent(t.id)}`}
                      title={t.titel}
                      className={`flex items-center gap-1 truncate rounded px-1 py-0.5 leading-tight ${STIL[t.umfang].chip} ${
                        t.status === "vorbehalt" ? "opacity-60" : ""
                      }`}
                    >
                      {start != null && <span className="tabular-nums opacity-80">{zeitText(start)}</span>}
                      {t.anmeldung && <I icon={Ticket} className="size-3" />}
                      <span className="truncate">{t.titel}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-grau">
        {Object.values(STIL).map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-sm ${s.punkt}`} />
            {s.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <I icon={Ticket} className="size-3.5" />
          Karten / Anmeldung
        </li>
      </ul>

      {/* Handy: Liste unter dem Raster */}
      <ul className="divide-y divide-linie overflow-hidden rounded-lg border border-linie bg-white text-sm sm:hidden">
        {[...proTag].map(([datum, termine]) =>
          termine.map((t) => {
            const start = plan.get(t.id)?.start;
            return (
              <li key={t.id}>
                <Link href={`/termin/${encodeURIComponent(t.id)}`} className="flex items-center gap-3 px-3 py-2">
                  <span className={`size-2 shrink-0 rounded-full ${STIL[t.umfang].punkt}`} />
                  <span className="w-24 shrink-0 tabular-nums text-grau">
                    {datumKurz(datum)} {start != null ? zeitText(start) : ""}
                  </span>
                  <span className="truncate">{t.titel}</span>
                  {t.anmeldung && <I icon={Ticket} className="ml-auto size-3.5 text-marke-700" />}
                </Link>
              </li>
            );
          }),
        )}
      </ul>
    </div>
  );
}
