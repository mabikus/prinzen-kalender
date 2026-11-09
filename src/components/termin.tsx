import Link from "next/link";
import { BESETZUNG, FAHRT, KATEGORIE } from "@/lib/labels";
import type { Termin } from "@/lib/types";
import type { Zeitfenster } from "@/lib/zeit";
import { zeitText } from "@/lib/zeit";

export function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function BesetzungBadge({ t }: { t: Termin }) {
  const b = BESETZUNG[t.besetzung];
  return (
    <Badge className={b.farbe}>
      <span title={b.beschreibung}>{b.label}</span>
    </Badge>
  );
}

const NEUTRAL =
  "bg-white text-zinc-700 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700";

export function TerminBadges({ t }: { t: Termin }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <BesetzungBadge t={t} />
      <Badge className={NEUTRAL}>
        {FAHRT[t.fahrt].icon} {FAHRT[t.fahrt].label}
      </Badge>
      {t.familie && <Badge className={NEUTRAL}>👨‍👩‍👧 Familie</Badge>}
      {t.status === "vorbehalt" && (
        <Badge className="bg-yellow-50 text-yellow-900 ring-yellow-300 dark:bg-yellow-950 dark:text-yellow-100 dark:ring-yellow-800">
          unter Vorbehalt
        </Badge>
      )}
    </div>
  );
}

export function Orte({ t }: { t: Termin }) {
  const treff = t.treffpunkt;
  const ort = t.ort && t.ort !== treff ? t.ort : null;
  if (!treff && !ort) return null;
  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      📍 {treff}
      {treff && ort && " → "}
      {ort}
    </p>
  );
}

/** Eine Zeile in der Terminliste */
export function TerminZeile({
  t,
  z,
  vorher,
  vergangen,
}: {
  t: Termin;
  z: Zeitfenster | undefined;
  vorher?: Termin;
  vergangen?: boolean;
}) {
  const hauptzeit = z?.start != null ? zeitText(z.start) : null;
  const istTreff = !!t.treffzeit;
  const nebenzeiten = [
    t.einlass && `Einlass ${t.einlass}`,
    t.beginn && istTreff && `Beginn ${t.beginn}`,
  ].filter(Boolean);

  return (
    <Link
      href={`/termin/${encodeURIComponent(t.id)}`}
      className={`group flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-red-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800 ${
        vergangen ? "opacity-55" : ""
      } ${t.status === "vorbehalt" ? "border-dashed" : ""}`}
    >
      <div className="w-14 shrink-0 text-right">
        {hauptzeit ? (
          <>
            <div className="text-lg font-semibold tabular-nums leading-6">
              {t.anschluss_an && !startzeitBekannt(t) ? "≈" : ""}
              {hauptzeit}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500">
              {t.anschluss_an && !startzeitBekannt(t) ? "danach" : istTreff ? "Treffen" : "Beginn"}
            </div>
          </>
        ) : (
          <div className="text-xs leading-6 text-zinc-500">ganztags / offen</div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-semibold leading-6 group-hover:text-red-700 dark:group-hover:text-red-400">
          <span className="mr-1">{KATEGORIE[t.kategorie].icon}</span>
          {t.titel}
        </h3>
        {t.anschluss_an && vorher && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">im Anschluss an „{vorher.titel}“</p>
        )}
        <Orte t={t} />
        {nebenzeiten.length > 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{nebenzeiten.join(" · ")}</p>
        )}
        <TerminBadges t={t} />
        {t.fahrt_details && <p className="text-sm text-zinc-700 dark:text-zinc-300">🙋 {t.fahrt_details}</p>}
        {t.hinweis && <p className="text-sm font-medium text-red-700 dark:text-red-400">⚠️ {t.hinweis}</p>}
        {t.bemerkung && <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.bemerkung}</p>}
        {t.pruefen && (
          <p className="rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-900 dark:bg-orange-950 dark:text-orange-200">
            🔎 Prüfen: {t.pruefen}
          </p>
        )}
      </div>
    </Link>
  );
}

function startzeitBekannt(t: Termin) {
  return !!(t.treffzeit ?? t.beginn ?? t.einlass);
}
