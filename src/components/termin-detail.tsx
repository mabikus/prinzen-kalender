import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Lock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Flag,
  MapPin,
  Navigation,
  Pencil,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { ANMELDUNG_ICON, GruppenBadges, I } from "@/components/termin";
import { DetailsKopieren } from "@/components/details-kopieren";
import { adresseText, kartenLink } from "@/lib/adresse";
import { ladeAnsicht } from "@/lib/vertraulich";
import { ANMELDUNG, ART, personenBedarf, personenVon, STATUS, UMFANG } from "@/lib/labels";
import { aktuellerAdmin } from "@/lib/sitzung";
import { datumLang, zeitplan, zeitText } from "@/lib/zeit";



/** Weiße Karte mit Trennlinien (wie eine Liste in einer App) */
function Karte({ titel, children }: { titel?: string; children: React.ReactNode }) {
  return (
    <section>
      {titel ? <h2 className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-grau">{titel}</h2> : null}
      <div className="divide-y divide-linie overflow-hidden rounded-[14px] border border-linie bg-panel">{children}</div>
    </section>
  );
}

/** Info-Zeile: kleine Bezeichnung oben, Inhalt darunter – bricht nie unschön um */
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[13px] font-medium text-grau">{label}</div>
      <div className="mt-0.5 text-[16px] leading-snug text-tinte">{children}</div>
    </div>
  );
}

/** Ort als antippbare Zeile – öffnet die Navigation */
function OrtZeile({
  icon,
  label,
  name,
  zeit,
  adresse,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  zeit?: string | null;
  adresse?: string | null;
}) {
  const inhalt = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
        <I icon={icon} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-grau">
          {label}
          {zeit ? <span className="text-tinte"> · {zeit} Uhr</span> : null}
        </span>
        <span className="block text-[17px] font-semibold leading-snug text-tinte">{name}</span>
        {adresse && adresse !== name ? <span className="block text-[15px] leading-snug text-grau">{adresse}</span> : null}
      </span>
    </>
  );
  if (name === "im Anschluss") return <div className="flex items-center gap-3 px-4 py-3">{inhalt}</div>;
  return (
    <a href={kartenLink(name, adresse)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 active:bg-papier">
      {inhalt}
      <I icon={Navigation} className="size-[18px] text-marke-700" />
    </a>
  );
}

function Kopf({ datum, imBlatt, bearbeitenId }: { datum: string; imBlatt?: boolean; bearbeitenId?: string }) {
  if (imBlatt && !bearbeitenId) return null;
  return (
    <div className="flex items-center justify-between">
      {imBlatt ? (
        <span />
      ) : (
        <Link href={`/#${datum}`} className="-ml-2 inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-[16px] text-marke-700">
          <I icon={ChevronLeft} className="size-5" />
          Termine
        </Link>
      )}
      {bearbeitenId ? (
        <Link
          href={`/verwaltung/termine/${encodeURIComponent(bearbeitenId)}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3.5 py-1.5 text-[15px] font-semibold text-marke-700 ring-1 ring-inset ring-linie"
        >
          <I icon={Pencil} className="size-4" />
          Bearbeiten
        </Link>
      ) : null}
    </div>
  );
}

async function KopfMitBearbeiten({ id, datum, imBlatt }: { id: string; datum: string; imBlatt?: boolean }) {
  const admin = await aktuellerAdmin();
  return <Kopf datum={datum} imBlatt={imBlatt} bearbeitenId={admin ? id : undefined} />;
}

/**
 * Inhalt eines Termins – als eigene Seite (/termin/…) und als Blatt über Liste/Monat (@modal).
 * `imBlatt`: ohne „‹ Termine“-Link, das Blatt hat seinen eigenen Schließen-Knopf.
 */
export async function TerminDetail({ params, imBlatt }: { params: Promise<{ id: string }>; imBlatt?: boolean }) {
  const { id } = await params;
  const daten = await ladeAnsicht();
  const t = daten.termine.find((x) => x.id === decodeURIComponent(id));
  if (!t) notFound();

  const z = zeitplan(daten.termine).get(t.id);
  const vorher = t.anschluss_an ? daten.termine.find((x) => x.id === t.anschluss_an) : undefined;
  const geschaetzt = !t.ende && z?.ende != null;
  const bedarf = personenBedarf(t, daten.gruppen);
  const adresse = adresseText(t);
  // Veranstaltungsort: eigener Name, sonst (bei Adresse) der Treffpunkt bzw. die Adresse selbst
  const venue = (t.ort && t.ort !== t.treffpunkt) || adresse ? (t.ort ?? t.treffpunkt ?? adresse!) : null;

  // Zum Kopieren: Titel, Datum, Treffen/Beginn mit Ort (und ein wichtiger Hinweis)
  const kopierText = [
    t.titel,
    datumLang(t.datum),
    t.treffzeit ? `Treffen ${t.treffzeit} Uhr${t.treffpunkt ? ` – ${t.treffpunkt}` : ""}` : null,
    t.beginn ? `Beginn ${t.beginn} Uhr${venue ? ` – ${venue}` : ""}` : null,
    !t.treffzeit && !t.beginn ? (vorher ? `im Anschluss an „${vorher.titel}“` : "Uhrzeit noch offen") : null,
    adresse && adresse !== venue ? adresse : null,
    t.hinweis ? `Hinweis: ${t.hinweis}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Zeitleiste: Treffen · Beginn · Ende (nur was es gibt)
  const zeiten: { label: string; wert: string; ca?: boolean }[] = [];
  if (t.treffzeit) zeiten.push({ label: "Treffen", wert: t.treffzeit });
  if (t.beginn) zeiten.push({ label: "Beginn", wert: t.beginn });
  if (!t.treffzeit && !t.beginn && z?.start != null) zeiten.push({ label: "danach", wert: zeitText(z.start), ca: true });
  if (z?.ende != null) zeiten.push({ label: "Ende", wert: zeitText(z.ende), ca: geschaetzt });

  return (
    <article className="space-y-5">
      {/* Kopf */}
      {/* Kopf – „Bearbeiten“ hängt an der Anmeldung und kommt getrennt nach; der Rest ist vorbereitet */}
      <Suspense fallback={imBlatt ? null : <Kopf datum={t.datum} />}>
        <KopfMitBearbeiten id={t.id} datum={t.datum} imBlatt={imBlatt} />
      </Suspense>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold uppercase tracking-[0.1em]">
          {t.vertraulich ? (
            <span className="inline-flex items-center gap-1 text-marke-700">
              <I icon={Lock} className="size-3.5" />
              Vertraulich ·
            </span>
          ) : null}
          <span className="text-marke-700">{ART[t.art]}</span>
          {t.tagesprogramm ? <span className="text-grau">· {t.tagesprogramm}</span> : null}
          <DetailsKopieren text={kopierText} />
        </div>
        <h1 className="font-serif text-[28px] font-semibold leading-[1.15] text-tinte [hyphens:auto] [overflow-wrap:anywhere] sm:text-[34px]" lang="de">
          {t.titel}
        </h1>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[16px] text-tinte/80">{datumLang(t.datum)}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${
              t.status === "vorbehalt" ? "bg-stone-100 text-stone-600" : "bg-marke-50 text-marke-700"
            }`}
          >
            <I icon={t.status === "vorbehalt" ? Clock : Flag} className="size-3.5" />
            {STATUS[t.status]}
          </span>
        </div>
      </header>

      {/* Uhrzeiten auf einen Blick */}
      {zeiten.length ? (
        <div
          className="grid divide-x divide-linie overflow-hidden rounded-[14px] border border-linie bg-panel"
          style={{ gridTemplateColumns: `repeat(${zeiten.length}, minmax(0, 1fr))` }}
        >
          {zeiten.map((x) => (
            <div key={x.label} className="px-2 py-3 text-center">
              <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-grau">{x.label}</div>
              <div className={`mt-1 font-serif text-[26px] font-semibold leading-none tabular-nums ${x.label === "Ende" ? "text-tinte/70" : "text-marke-700"}`}>
                {x.ca ? <span className="mr-0.5 font-sans text-[13px] font-medium text-grau">ca.</span> : null}
                {x.wert}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[14px] border border-linie bg-panel px-4 py-3 text-[16px] text-grau">Uhrzeit noch offen</p>
      )}

      {t.hinweis ? (
        <p className="flex items-start gap-2.5 rounded-[14px] bg-marke-700 px-4 py-3 text-[16px] font-semibold text-white">
          <I icon={TriangleAlert} className="mt-0.5 size-5" />
          {t.hinweis}
        </p>
      ) : null}

      {/* Orte */}
      {t.treffpunkt || venue || vorher ? (
        <Karte>
          {vorher ? (
            <Link
              href={`/termin/${encodeURIComponent(vorher.id)}`}
              replace={imBlatt}
              scroll={false}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
                <I icon={Clock} className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-grau">im Anschluss an</span>
                <span className="block text-[17px] font-semibold leading-snug">{vorher.titel}</span>
              </span>
              <I icon={ChevronRight} className="size-5 text-grau" />
            </Link>
          ) : null}
          {t.treffpunkt ? <OrtZeile icon={MapPin} label="Treffpunkt" name={t.treffpunkt} zeit={t.treffzeit} /> : null}
          {venue ? <OrtZeile icon={Flag} label="Veranstaltungsort" name={venue} zeit={t.beginn} adresse={adresse} /> : null}
        </Karte>
      ) : null}

      {/* Karten */}
      {t.anmeldung ? (
        <Karte titel={ANMELDUNG[t.anmeldung].label}>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marke-50 text-marke-700">
              <I icon={ANMELDUNG_ICON[t.anmeldung]} className="size-[18px]" />
            </span>
            {/* „Bestellt“ ist intern und steht nur in der Verwaltung */}
            <div className="flex flex-1 items-baseline gap-2">
              <span className="font-serif text-[26px] font-semibold leading-none tabular-nums">
                {bedarf.summe}
                {bedarf.ohneAngabe.length ? <span className="text-grau">+</span> : null}
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-grau">Personen</span>
            </div>
          </div>
          {bedarf.dabei.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-2.5 text-[15px]">
              <span>{g.name}</span>
              <span className={personenVon(t, g) == null ? "text-marke-700" : "tabular-nums text-grau"}>{personenVon(t, g) ?? "Anzahl fehlt"}</span>
            </div>
          ))}
        </Karte>
      ) : null}

      {/* Weitere Angaben */}
      <Karte titel="Details">
        <Info label="Wer ist dabei?">
          <div className="mt-1 flex flex-wrap gap-1.5">
            <GruppenBadges t={t} gruppen={daten.gruppen} />
          </div>
          {t.umfang !== "auswahl" ? <p className="mt-1 text-[14px] text-grau">{UMFANG[t.umfang].beschreibung}</p> : null}
        </Info>
        {t.veranstalter ? <Info label="Veranstalter">{t.veranstalter}</Info> : null}
        {t.bemerkung ? <Info label="Bemerkung">{t.bemerkung}</Info> : null}
        {t.pruefen ? (
          <div className="flex items-start gap-2.5 bg-stone-50 px-4 py-3 text-[15px] text-stone-700">
            <I icon={CircleHelp} className="mt-0.5 size-4" />
            <span>
              <strong>Noch prüfen:</strong> {t.pruefen}
            </span>
          </div>
        ) : null}
      </Karte>

      {/* Aktionen */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        <a
          href={`/termin/${encodeURIComponent(t.id)}/ics`}
          className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-marke-700 text-[16px] font-semibold text-white active:brightness-90"
        >
          <I icon={CalendarPlus} className="size-5" />
          In meinen Kalender
        </a>
        {venue && adresse ? (
          <a
            href={kartenLink(venue, adresse)}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] border border-linie bg-panel text-[16px] font-semibold text-tinte active:bg-papier"
          >
            <I icon={Navigation} className="size-5" />
            Zum Veranstaltungsort navigieren
          </a>
        ) : null}
        {t.treffpunkt && t.treffpunkt !== "im Anschluss" ? (
          <a
            href={kartenLink(t.treffpunkt)}
            target="_blank"
            rel="noreferrer"
            className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] border border-linie bg-panel text-[16px] font-semibold text-tinte active:bg-papier"
          >
            <I icon={Navigation} className="size-5" />
            Zum Treffpunkt navigieren
          </a>
        ) : null}
      </div>

      <p className="text-center text-[13px] text-grau">
        Quelle: {t.quelle.map((q) => (q === "kg" ? "KG-Terminplan" : q === "eigen" ? "eigene Liste" : q)).join(" + ") || "Verwaltung"}
      </p>
    </article>
  );
}
