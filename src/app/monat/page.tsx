import Link from "next/link";
import { Suspense } from "react";
import { ladeDaten } from "@/lib/daten";
import { FARBEN } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import { jetztInBerlin, MONATE, zeitplan, zeitText } from "@/lib/zeit";

export const metadata = { title: "Monat" };

export default function MonatSeite({ searchParams }: PageProps<"/monat">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Lade Monat …</p>}>
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

const ALLE = "bg-red-100 text-red-900 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-800";
const JEDER = "bg-zinc-200 text-zinc-800 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700";

/** Farbe eines Eintrags: Alle = rot, Jeder Verfügbare = grau, sonst Farbe der ersten Gruppe. */
function farbe(t: Termin, gruppen: Gruppe[]): string {
  if (t.umfang === "alle") return ALLE;
  if (t.umfang === "jeder_verfuegbare") return JEDER;
  const g = gruppen.find((x) => t.gruppen.includes(x.id));
  return g ? FARBEN[g.farbe].badge : JEDER;
}

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

  const tageImMonat = new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
  const ersterWochentag = (new Date(Date.UTC(jahr, monat - 1, 1)).getUTCDay() + 6) % 7; // Mo = 0
  const zellen: (number | null)[] = [
    ...Array(ersterWochentag).fill(null),
    ...Array.from({ length: tageImMonat }, (_, i) => i + 1),
  ];
  while (zellen.length % 7) zellen.push(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/monat?m=${monatPlus(ym, -1)}`} className="rounded-lg px-3 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800">
          ←
        </Link>
        <h1 className="text-xl font-bold">
          {MONATE[monat - 1]} {jahr}
        </h1>
        <Link href={`/monat?m=${monatPlus(ym, 1)}`} className="rounded-lg px-3 py-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800">
          →
        </Link>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 text-xs gap-px dark:border-zinc-800 dark:bg-zinc-800">
        {WT.map((w) => (
          <div key={w} className="bg-zinc-100 py-1 text-center font-semibold text-zinc-500 dark:bg-zinc-900">
            {w}
          </div>
        ))}
        {zellen.map((tag, i) => {
          if (tag === null) return <div key={i} className="min-h-20 bg-zinc-50 dark:bg-zinc-950" />;
          const datum = `${ym}-${String(tag).padStart(2, "0")}`;
          const termine = proTag.get(datum) ?? [];
          const heute = datum === jetzt.datum;
          return (
            <div key={i} className="min-h-20 space-y-0.5 bg-white p-1 dark:bg-zinc-900">
              <div
                className={`text-right font-semibold ${
                  heute ? "text-red-700 dark:text-red-400" : "text-zinc-400"
                }`}
              >
                {tag}
              </div>
              {termine.map((t) => {
                const start = plan.get(t.id)?.start;
                return (
                  <Link
                    key={t.id}
                    href={`/termin/${encodeURIComponent(t.id)}`}
                    title={t.titel}
                    className={`block truncate rounded px-1 py-0.5 leading-tight ring-1 ring-inset ${farbe(t, gruppen)} ${
                      t.status === "vorbehalt" ? "border-dashed opacity-70" : ""
                    }`}
                  >
                    <span className="sm:hidden">{t.anmeldung ? "🎟" : "•"}</span>
                    <span className="hidden sm:inline">
                      {start != null && `${zeitText(start)} `}
                      {t.anmeldung && "🎟️ "}
                      {t.titel}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-2 text-xs">
        <li className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${ALLE}`}>Alle</li>
        <li className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${JEDER}`}>Jeder Verfügbare</li>
        {gruppen.map((g) => (
          <li key={g.id} className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${FARBEN[g.farbe].badge}`}>
            {g.name}
          </li>
        ))}
        <li className="px-1 py-0.5">🎟️ = Karten/Anmeldung</li>
      </ul>

      <ul className="space-y-1 text-sm sm:hidden">
        {[...proTag].map(([datum, termine]) =>
          termine.map((t) => {
            const start = plan.get(t.id)?.start;
            return (
              <li key={t.id}>
                <Link href={`/termin/${encodeURIComponent(t.id)}`} className="flex gap-2">
                  <span className="w-20 shrink-0 tabular-nums text-zinc-500">
                    {Number(datum.slice(8))}. {start != null ? zeitText(start) : ""}
                  </span>
                  <span className="truncate">
                    {t.anmeldung && "🎟️ "}
                    {t.titel}
                  </span>
                </Link>
              </li>
            );
          }),
        )}
      </ul>
    </div>
  );
}
