import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Clock,
  ClipboardPen,
  MapPin,
  Ticket,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { ANMELDUNG, personenBedarf, UMFANG } from "@/lib/labels";
import type { Gruppe, Termin } from "@/lib/types";
import type { Zeitfenster } from "@/lib/zeit";
import { zeitText } from "@/lib/zeit";

/** Einheitliche Linien-Icons */
export function I({ icon: Icon, className = "size-4" }: { icon: LucideIcon; className?: string }) {
  return <Icon className={`shrink-0 ${className}`} strokeWidth={1.75} aria-hidden />;
}

export const ANMELDUNG_ICON = { eintrittskarte: Ticket, voranmeldung: ClipboardPen } as const;

type Variante = "voll" | "rahmen" | "neutral" | "hell" | "gestrichelt";

const VARIANTE: Record<Variante, string> = {
  voll: "bg-marke-700 text-white ring-1 ring-inset ring-marke-700",
  rahmen: "bg-panel text-marke-800 ring-1 ring-inset ring-marke-300",
  neutral: "bg-panel text-tinte/80 ring-1 ring-inset ring-linie",
  hell: "bg-marke-50 text-marke-800 ring-1 ring-inset ring-marke-200",
  gestrichelt: "bg-transparent text-grau border border-dashed border-grau/50",
};

export function Badge({
  variante = "neutral",
  children,
  title,
}: {
  variante?: Variante;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${VARIANTE[variante]}`}
    >
      {children}
    </span>
  );
}

/** Wer ist dabei? */
export function GruppenBadges({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  const einzeln =
    t.umfang === "auswahl"
      ? gruppen.filter((g) => t.gruppen.includes(g.id))
      : gruppen.filter((g) => !g.in_alle && t.gruppen.includes(g.id));
  return (
    <>
      {t.umfang !== "auswahl" && (
        <Badge variante={t.umfang === "alle" ? "voll" : "rahmen"} title={UMFANG[t.umfang].beschreibung}>
          {UMFANG[t.umfang].label}
        </Badge>
      )}
      {einzeln.map((g) => (
        <Badge key={g.id} title={g.beschreibung ?? undefined}>
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
    <Badge variante={offen ? "hell" : "neutral"} title={ANMELDUNG[t.anmeldung].label}>
      <I icon={ANMELDUNG_ICON[t.anmeldung]} className="size-3.5" />
      {b.summe}
      {b.ohneAngabe.length > 0 && "+"} Pers.
      {t.karten_bestellt != null && ` · ${t.karten_bestellt} bestellt`}
    </Badge>
  );
}

export function TerminBadges({ t, gruppen }: { t: Termin; gruppen: Gruppe[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <GruppenBadges t={t} gruppen={gruppen} />
      <KartenBadge t={t} gruppen={gruppen} />
      {t.status === "vorbehalt" && (
        <Badge variante="gestrichelt">
          <I icon={Clock} className="size-3.5" />
          Vorbehalt
        </Badge>
      )}
      {t.art === "intern" && <span className="text-xs uppercase tracking-wider text-grau">Intern</span>}
    </div>
  );
}

export function Orte({ t, className = "text-grau" }: { t: Termin; className?: string }) {
  const treff = t.treffpunkt;
  const ort = t.ort && t.ort !== treff ? t.ort : null;
  if (!treff && !ort) return null;
  return (
    <p className={`flex items-start gap-1.5 text-sm ${className}`}>
      <I icon={MapPin} className="mt-0.5 size-3.5" />
      <span>
        {treff}
        {treff && ort && " → "}
        {ort}
      </span>
    </p>
  );
}

export function Hinweis({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-sm font-medium text-marke-700">
      <I icon={TriangleAlert} className="mt-0.5 size-3.5" />
      <span>{children}</span>
    </p>
  );
}

export function Pruefen({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700">
      <I icon={CircleHelp} className="mt-px size-3.5" />
      <span>
        <span className="font-semibold">Prüfen:</span> {children}
      </span>
    </p>
  );
}

function Zeit({ t, z }: { t: Termin; z: Zeitfenster | undefined }) {
  if (z?.start == null) return <div className="pt-1 text-xs leading-5 text-grau">Uhrzeit offen</div>;
  const geschaetzt = !t.treffzeit && !t.beginn;
  return (
    <>
      {geschaetzt && <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-grau">ca.</div>}
      <div className="font-serif text-xl font-semibold tabular-nums leading-6">{zeitText(z.start)}</div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-grau">
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
  /** innerhalb eines Tagesprogramms: ohne eigenen Rahmen */
  kompakt?: boolean;
}) {
  return (
    <Link
      href={`/termin/${encodeURIComponent(t.id)}`}
      className={`group flex gap-4 p-3.5 transition ${
        kompakt
          ? "hover:bg-papier"
          : "rounded-lg border border-linie bg-panel shadow-[0_1px_2px_rgba(31,26,23,0.04)] hover:border-marke-300"
      } ${vergangen ? "opacity-50" : ""}`}
    >
      <div className="w-[4.5rem] shrink-0 border-r border-linie pr-3 text-right">
        <Zeit t={t} z={z} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="font-semibold leading-snug group-hover:text-marke-700">{t.titel}</h3>
        {t.anschluss_an && vorher && <p className="text-sm text-grau">im Anschluss an „{vorher.titel}“</p>}
        <Orte t={t} />
        {t.treffzeit && t.beginn && (
          <p className="flex items-center gap-1.5 text-sm text-grau">
            <I icon={Clock} className="size-3.5" />
            Beginn {t.beginn}
          </p>
        )}
        <TerminBadges t={t} gruppen={gruppen} />
        {t.hinweis && <Hinweis>{t.hinweis}</Hinweis>}
        {t.bemerkung && <p className="text-sm text-tinte/80">{t.bemerkung}</p>}
        {t.pruefen && <Pruefen>{t.pruefen}</Pruefen>}
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
      className={`group/p overflow-hidden rounded-lg border border-linie bg-panel shadow-[0_1px_2px_rgba(31,26,23,0.04)] ${
        alleVergangen ? "opacity-50" : ""
      }`}
    >
      <summary className="flex cursor-pointer list-none gap-4 border-l-[3px] border-marke-700 p-3.5 hover:bg-papier">
        <div className="w-[4.5rem] shrink-0 border-r border-linie pr-3 text-right">
          {von != null ? (
            <>
              <div className="font-serif lining-nums text-xl font-semibold tabular-nums leading-6">{zeitText(von)}</div>
              {bis != null && <div className="mt-0.5 text-[10px] tabular-nums text-grau">bis {zeitText(bis)}</div>}
            </>
          ) : (
            <div className="pt-1 text-xs leading-5 text-grau">Uhrzeit offen</div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-serif lining-nums text-lg font-semibold leading-snug text-marke-800">{name}</h3>
              <p className="text-xs uppercase tracking-wider text-grau">{termine.length} Programmpunkte</p>
            </div>
            <ChevronDown
              className="mt-1 size-5 shrink-0 text-grau transition group-open/p:rotate-180"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <p className="line-clamp-2 text-sm text-grau">{termine.map((t) => t.titel).join(" · ")}</p>
          {(vorbehalt > 0 || karten > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {vorbehalt > 0 && (
                <Badge variante="gestrichelt">
                  <I icon={Clock} className="size-3.5" />
                  {vorbehalt}× Vorbehalt
                </Badge>
              )}
              {karten > 0 && (
                <Badge variante="hell">
                  <I icon={Ticket} className="size-3.5" />
                  {karten}× Karten/Anmeldung
                </Badge>
              )}
            </div>
          )}
        </div>
      </summary>
      <div className="divide-y divide-linie border-t border-linie">
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
