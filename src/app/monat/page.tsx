import Link from "next/link";
import { Suspense } from "react";
import { BESETZUNG, KATEGORIE } from "@/lib/labels";
import { ladeTermine } from "@/lib/termine";
import type { Termin } from "@/lib/types";
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

async function Monat({ searchParams }: Pick<PageProps<"/monat">, "searchParams">) {
  const sp = await searchParams;
  const jetzt = jetztInBerlin();
  const ym = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : jetzt.datum.slice(0, 7);
  const [jahr, monat] = ym.split("-").map(Number);

  const alle = await ladeTermine();
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
                    className={`block truncate rounded px-1 py-0.5 leading-tight ring-1 ring-inset ${
                      BESETZUNG[t.besetzung].farbe
                    } ${t.status === "vorbehalt" ? "opacity-70" : ""}`}
                  >
                    <span className="hidden sm:inline">{start != null && `${zeitText(start)} `}</span>
                    {KATEGORIE[t.kategorie].icon}
                    <span className="hidden sm:inline"> {t.titel}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-2 text-xs">
        {Object.values(BESETZUNG).map((b) => (
          <li key={b.label} className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${b.farbe}`}>
            {b.label}
          </li>
        ))}
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
                    {KATEGORIE[t.kategorie].icon} {t.titel}
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
