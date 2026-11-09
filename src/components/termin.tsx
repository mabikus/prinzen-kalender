import Link from "next/link";
import { ANMELDUNG, ART, FARBEN, personenBedarf, UMFANG } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import type { Zeitfenster } from "@/lib/zeit";
import { zeitText } from "@/lib/zeit";

export function Badge({ className = "", children, title }: { className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

const NEUTRAL = "bg-white text-zinc-700 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700";
const ALLE = "bg-red-600 text-white ring-red-600 dark:bg-red-700 dark:ring-red-700";
const JEDER = "bg-zinc-700 text-white ring-zinc-700 dark:bg-zinc-600 dark:ring-zinc-600";

/** Wer ist dabei? */
export function GruppenBadges({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  const einzeln =
    t.umfang === "auswahl" ? gruppen.filter((g) => t.gruppen.includes(g.id)) : gruppen.filter((g) => !g.in_alle && t.gruppen.includes(g.id));
  return (
    <>
      {t.umfang !== "auswahl" && (
        <Badge className={t.umfang === "alle" ? ALLE : JEDER} title={UMFANG[t.umfang].beschreibung}>
          {t.umfang === "alle" ? "Alle" : "Jeder Verfügbare"}
        </Badge>
      )}
      {einzeln.map((g) => (
        <Badge key={g.id} className={FARBEN[g.farbe].badge} title={g.beschreibung ?? undefined}>
          {g.name}
        </Badge>
      ))}
    </>
  );
}

export function KartenBadge({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  if (!t.anmeldung) return null;
  const b = personenBedarf(t, gruppen);
  const offen = t.karten_bestellt == null || t.karten_bestellt < b.summe;
  return (
    <Badge
      className={
        offen
          ? "bg-amber-100 text-amber-900 ring-amber-400 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-700"
          : "bg-emerald-100 text-emerald-900 ring-emerald-400 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-700"
      }
      title={ANMELDUNG[t.anmeldung].label}
    >
      {ANMELDUNG[t.anmeldung].icon} {b.summe}
      {b.ohneAngabe.length > 0 && "+"} Pers.
      {t.karten_bestellt != null && ` · ${t.karten_bestellt} bestellt`}
    </Badge>
  );
}

export function TerminBadges({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <GruppenBadges t={t} gruppen={gruppen} />
      <KartenBadge t={t} gruppen={gruppen} />
      {t.status === "vorbehalt" && (
        <Badge className="bg-yellow-50 text-yellow-900 ring-yellow-300 dark:bg-yellow-950 dark:text-yellow-100 dark:ring-yellow-800">
          unter Vorbehalt
        </Badge>
      )}
      {t.art === "intern" && <Badge className={NEUTRAL}>{ART.intern}</Badge>}
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

function Zeit({ t, z }: { t: Termin; z: Zeitfenster | undefined }) {
  if (z?.start == null) return <div className="text-xs leading-6 text-zinc-500">Uhrzeit offen</div>;
  const geschaetzt = !t.treffzeit && !t.beginn;
  return (
    <>
      <div className="text-lg font-semibold tabular-nums leading-6">
        {geschaetzt && "≈"}
        {zeitText(z.start)}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {geschaetzt ? "danach" : t.treffzeit ? "Treffen" : "Beginn"}
      </div>
    </>
  );
}

/** Eine Zeile in der Terminliste */
export function TerminZeile({
  t,
  z,
  gruppen,
  vorher,
  vergangen,
  kompakt,
}: {
  t: Termin;
  z: Zeitfenster | undefined;
  gruppen: Gruppe[];
  vorher?: Termin;
  vergangen?: boolean;
  /** innerhalb eines Tagesprogramms: weniger Rahmen */
  kompakt?: boolean;
}) {
  return (
    <Link
      href={`/termin/${encodeURIComponent(t.id)}`}
      className={`group flex gap-3 p-3 transition ${
        kompakt
          ? "rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          : "rounded-xl border border-zinc-200 bg-white hover:border-red-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
      } ${vergangen ? "opacity-55" : ""} ${t.status === "vorbehalt" && !kompakt ? "border-dashed" : ""}`}
    >
      <div className="w-14 shrink-0 text-right">
        <Zeit t={t} z={z} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-semibold leading-6 group-hover:text-red-700 dark:group-hover:text-red-400">{t.titel}</h3>
        {t.anschluss_an && vorher && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">im Anschluss an „{vorher.titel}“</p>
        )}
        <Orte t={t} />
        {t.treffzeit && t.beginn && <p className="text-sm text-zinc-600 dark:text-zinc-400">Beginn {t.beginn}</p>}
        <TerminBadges t={t} gruppen={gruppen} />
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

/**
 * Tagesprogramm (z. B. Weiberdonnerstag) als aufklappbare Karte:
 * zusammengefasst sichtbar, Einzeltermine per Klick.
 */
export function ProgrammKarte({
  name,
  termine,
  plan,
  gruppen,
  nachId,
  vergangen,
  offen,
}: {
  name: string;
  termine: Termin[];
  plan: Map<string, Zeitfenster>;
  gruppen: Gruppe[];
  nachId: Map<string, Termin>;
  vergangen: (t: Termin) => boolean;
  offen?: boolean;
}) {
  const zeiten = termine.map((t) => plan.get(t.id)).filter((z) => z?.start != null) as Zeitfenster[];
  const von = zeiten.length ? Math.min(...zeiten.map((z) => z.start!)) : null;
  const bis = zeiten.length ? Math.max(...zeiten.map((z) => z.ende ?? z.start!)) : null;
  const alleVergangen = termine.every(vergangen);
  const vorbehalt = termine.filter((t) => t.status === "vorbehalt").length;
  const karten = termine.filter((t) => t.anmeldung).length;

  return (
    <details
      open={offen}
      className={`group/p rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${
        alleVergangen ? "opacity-55" : ""
      }`}
    >
      <summary className="flex cursor-pointer list-none gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <div className="w-14 shrink-0 text-right">
          {von != null ? (
            <>
              <div className="text-lg font-semibold tabular-nums leading-6">{zeitText(von)}</div>
              {bis != null && <div className="text-[11px] tabular-nums text-zinc-500">bis {zeitText(bis)}</div>}
            </>
          ) : (
            <div className="text-xs leading-6 text-zinc-500">Uhrzeit offen</div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="flex items-center gap-2 font-semibold leading-6">
            <span className="rounded bg-green-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              {name}
            </span>
            <span className="text-sm font-normal text-zinc-500">{termine.length} Programmpunkte</span>
          </h3>
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {termine.map((t) => t.titel).join(" · ")}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            {vorbehalt > 0 && <span>{vorbehalt}× unter Vorbehalt</span>}
            {karten > 0 && <span>· {karten}× Karten/Anmeldung</span>}
            <span className="ml-auto font-medium text-red-700 group-open/p:hidden dark:text-red-400">
              Aufklappen ▾
            </span>
            <span className="ml-auto hidden font-medium text-zinc-500 group-open/p:inline">Zuklappen ▴</span>
          </div>
        </div>
      </summary>
      <div className="divide-y divide-zinc-100 border-t border-zinc-100 px-1 pb-1 dark:divide-zinc-800 dark:border-zinc-800">
        {termine.map((t) => (
          <TerminZeile
            key={t.id}
            t={t}
            z={plan.get(t.id)}
            gruppen={gruppen}
            vorher={t.anschluss_an ? nachId.get(t.anschluss_an) : undefined}
            vergangen={vergangen(t)}
            kompakt
          />
        ))}
      </div>
    </details>
  );
}
