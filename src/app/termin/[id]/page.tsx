import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarPlus,
  CircleCheck,
  CircleHelp,
  Clock,
  FileText,
  Flag,
  Landmark,
  MapPin,
  MessageSquareText,
  Navigation,
  Pencil,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ANMELDUNG_ICON, GruppenBadges, I } from "@/components/termin";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten } from "@/lib/daten";
import { ANMELDUNG, ART, personenBedarf, STATUS, UMFANG } from "@/lib/labels";
import { datumLang, zeitplan, zeitText } from "@/lib/zeit";

export default function TerminSeite({ params }: PageProps<"/termin/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade Termin …</p>}>
      <Detail params={params} />
    </Suspense>
  );
}

/** Link zur Kartensuche – funktioniert auf iPhone, Android und am PC. */
function karte(ort: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ort}, Kreis Ahrweiler`)}`;
}

function Zeile({ icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-linie py-3 last:border-0">
      <dt className="flex items-center gap-2 self-start pt-0.5 text-sm text-grau">
        <I icon={icon} className="size-4" />
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Ort({ name }: { name: string }) {
  if (name === "im Anschluss") return <>{name}</>;
  return (
    <a
      href={karte(name)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 text-marke-700 underline decoration-marke-200 underline-offset-2 hover:decoration-marke-700"
    >
      {name}
      <I icon={ArrowUpRight} className="size-3.5" />
    </a>
  );
}

const KNOPF =
  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold ring-1 ring-inset transition";

async function Detail({ params }: Pick<PageProps<"/termin/[id]">, "params">) {
  const { id } = await params;
  const daten = await ladeDaten();
  const t = daten.termine.find((x) => x.id === decodeURIComponent(id));
  if (!t) notFound();

  const z = zeitplan(daten.termine).get(t.id);
  const vorher = t.anschluss_an ? daten.termine.find((x) => x.id === t.anschluss_an) : undefined;
  const geschaetzt = !t.ende && z?.ende != null;
  const bedarf = personenBedarf(t, daten.gruppen);
  const bearbeiten = await darfBearbeiten();

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/#${t.datum}`} className="inline-flex items-center gap-1.5 text-sm text-grau hover:text-marke-700">
          <I icon={ArrowLeft} className="size-4" />
          Übersicht
        </Link>
        {bearbeiten && (
          <Link
            href={`/verwaltung/termin/${encodeURIComponent(t.id)}`}
            className={`${KNOPF} bg-white py-1.5 text-tinte/80 ring-linie hover:text-marke-700 hover:ring-marke-300`}
          >
            <I icon={Pencil} className="size-4" />
            Bearbeiten
          </Link>
        )}
      </div>

      <header className="space-y-3 border-b border-linie pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">
          {ART[t.art]}
          {t.tagesprogramm && ` · ${t.tagesprogramm}`}
        </p>
        <h1 className="font-serif lining-nums text-4xl font-semibold leading-tight">{t.titel}</h1>
        <p className="text-lg text-tinte/80">{datumLang(t.datum)}</p>
        <p
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            t.status === "vorbehalt" ? "text-grau" : "text-tinte/80"
          }`}
        >
          <I icon={t.status === "vorbehalt" ? Clock : CircleCheck} className="size-4" />
          {STATUS[t.status]}
        </p>
      </header>

      {t.hinweis && (
        <p className="flex items-start gap-2 rounded-lg border border-marke-200 bg-marke-50 p-3.5 font-medium text-marke-800">
          <I icon={TriangleAlert} className="mt-0.5 size-5" />
          {t.hinweis}
        </p>
      )}

      {t.anmeldung && (
        <section className="rounded-lg border border-linie bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-marke-700">
            <I icon={ANMELDUNG_ICON[t.anmeldung]} className="size-4" />
            {ANMELDUNG[t.anmeldung].label}
          </h2>
          <div className="mt-3 flex items-end gap-8">
            <div>
              <div className="font-serif lining-nums text-4xl font-semibold tabular-nums leading-none">
                {bedarf.summe}
                {bedarf.ohneAngabe.length > 0 && <span className="text-grau">+</span>}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-grau">Personen</div>
            </div>
            <div>
              <div className="font-serif lining-nums text-4xl font-semibold tabular-nums leading-none text-grau">
                {t.karten_bestellt ?? "–"}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-grau">bestellt</div>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-linie border-t border-linie text-sm">
            {bedarf.dabei.map((g) => (
              <li key={g.id} className="flex justify-between py-1.5">
                <span>{g.name}</span>
                <span className={g.personen == null ? "text-marke-700" : "tabular-nums text-grau"}>
                  {g.personen ?? "Anzahl fehlt"}
                </span>
              </li>
            ))}
          </ul>
          {bedarf.ohneAngabe.length > 0 && (
            <p className="mt-2 text-xs text-grau">Personenzahlen pflegen unter Verwaltung → Gruppen.</p>
          )}
        </section>
      )}

      <dl className="rounded-lg border border-linie bg-white px-5">
        {(t.treffzeit || t.treffpunkt) && (
          <Zeile icon={MapPin} label="Treffen">
            <span className="font-semibold tabular-nums">{t.treffzeit}</span>
            {t.treffzeit && t.treffpunkt && " · "}
            {t.treffpunkt && <Ort name={t.treffpunkt} />}
          </Zeile>
        )}
        {vorher && (
          <Zeile icon={Clock} label="Zeit">
            im Anschluss an{" "}
            <Link href={`/termin/${encodeURIComponent(vorher.id)}`} className="underline underline-offset-2">
              {vorher.titel}
            </Link>
            {z?.start != null && <span className="text-grau"> (ca. {zeitText(z.start)})</span>}
          </Zeile>
        )}
        {(t.beginn || t.ort) && (
          <Zeile icon={Flag} label="Beginn">
            <span className="font-semibold tabular-nums">{t.beginn}</span>
            {t.beginn && t.ort && " · "}
            {t.ort && <Ort name={t.ort} />}
          </Zeile>
        )}
        {z?.ende != null && (
          <Zeile icon={Clock} label="Ende">
            <span className="tabular-nums">
              {geschaetzt && "ca. "}
              {zeitText(z.ende)}
            </span>
            {geschaetzt && <span className="text-sm text-grau"> (geschätzt)</span>}
          </Zeile>
        )}
        {z?.ganztags && (
          <Zeile icon={Clock} label="Uhrzeit">
            <span className="text-grau">noch offen</span>
          </Zeile>
        )}
        {t.veranstalter && (
          <Zeile icon={Landmark} label="Veranstalter">
            {t.veranstalter}
          </Zeile>
        )}
        <Zeile icon={Users} label="Wer">
          <div className="flex flex-wrap gap-1.5">
            <GruppenBadges t={t} gruppen={daten.gruppen} />
          </div>
          {t.umfang !== "auswahl" && <p className="mt-1 text-sm text-grau">{UMFANG[t.umfang].beschreibung}</p>}
        </Zeile>
        {t.bemerkung && (
          <Zeile icon={MessageSquareText} label="Bemerkung">
            {t.bemerkung}
          </Zeile>
        )}
        <Zeile icon={FileText} label="Quelle">
          <span className="text-sm text-grau">
            {t.quelle.map((q) => (q === "kg" ? "KG-Terminplan" : q === "eigen" ? "eigene Liste" : q)).join(" + ") ||
              "–"}
          </span>
        </Zeile>
      </dl>

      {t.pruefen && (
        <p className="flex items-start gap-2 rounded-lg bg-stone-100 p-3.5 text-sm text-stone-700">
          <I icon={CircleHelp} className="mt-0.5 size-4" />
          <span>
            <strong>Noch prüfen:</strong> {t.pruefen}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={`/termin/${encodeURIComponent(t.id)}/ics`}
          className={`${KNOPF} bg-marke-700 text-white ring-marke-700 hover:bg-marke-800`}
        >
          <I icon={CalendarPlus} className="size-4" />
          In meinen Kalender
        </a>
        {t.treffpunkt && t.treffpunkt !== "im Anschluss" && (
          <a
            href={karte(t.treffpunkt)}
            target="_blank"
            rel="noreferrer"
            className={`${KNOPF} bg-white text-tinte ring-linie hover:text-marke-700 hover:ring-marke-300`}
          >
            <I icon={Navigation} className="size-4" />
            Navigation zum Treffpunkt
          </a>
        )}
      </div>
    </article>
  );
}
