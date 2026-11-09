import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Trash2, TriangleAlert } from "lucide-react";
import { GruppenAuswahl } from "@/components/gruppen-auswahl";
import { LoeschenKnopf } from "@/components/loeschen";
import { I } from "@/components/termin";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import type { Termin } from "@/lib/types";
import { datumKurz } from "@/lib/zeit";
import { terminLoeschen, terminSpeichern } from "../../aktionen";

export const metadata = { title: "Termin bearbeiten" };

export default function Seite(props: PageProps<"/verwaltung/termin/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade …</p>}>
      <Formular {...props} />
    </Suspense>
  );
}

const LEER: Omit<Termin, "id" | "datum"> = {
  treffzeit: null,
  treffpunkt: null,
  beginn: null,
  ort: null,
  ende: null,
  anschluss_an: null,
  titel: "",
  tagesprogramm: null,
  veranstalter: null,
  art: "extern",
  status: "bestaetigt",
  umfang: "auswahl",
  gruppen: ["prinz"],
  anmeldung: null,
  karten_bestellt: null,
  hinweis: null,
  bemerkung: null,
  quelle: [],
  pruefen: null,
};

const FELD =
  "w-full rounded-md border border-linie bg-white px-3 py-2 text-base outline-none focus:border-marke-300 focus:ring-2 focus:ring-marke-100";

function Feld({ label, hilfe, children }: { label: string; hilfe?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hilfe && <span className="block text-xs text-grau">{hilfe}</span>}
    </label>
  );
}

function Wahl({ name, wert, optionen }: { name: string; wert: string; optionen: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md bg-papier p-1 ring-1 ring-inset ring-linie">
      {optionen.map(([v, label]) => (
        <label
          key={v}
          className="flex-1 cursor-pointer rounded px-2 py-1.5 text-center text-sm font-medium text-grau has-checked:bg-white has-checked:text-marke-800 has-checked:shadow-sm has-checked:ring-1 has-checked:ring-marke-200"
        >
          <input type="radio" name={name} value={v} defaultChecked={wert === v} className="sr-only" />
          {label}
        </label>
      ))}
    </div>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-linie bg-white p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-marke-700">{titel}</legend>
      {children}
    </fieldset>
  );
}

async function Formular({ params, searchParams }: PageProps<"/verwaltung/termin/[id]">) {
  if (!(await darfBearbeiten())) redirect("/verwaltung");
  const { id } = await params;
  const sp = await searchParams;
  const daten = await ladeDaten();

  const neu = id === "neu";
  const vorhanden = neu ? undefined : daten.termine.find((t) => t.id === decodeURIComponent(id));
  if (!neu && !vorhanden) notFound();
  const vorlageDatum = typeof sp.datum === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.datum) ? sp.datum : "";
  const t: Termin = vorhanden ?? { ...LEER, id: "", datum: vorlageDatum };

  const sameDay = daten.termine.filter((x) => x.datum === t.datum && x.id !== t.id);
  const programme = [...new Set(daten.termine.map((x) => x.tagesprogramm).filter(Boolean))] as string[];
  const orte = [
    ...new Set(daten.termine.flatMap((x) => [x.treffpunkt, x.ort]).filter(Boolean)),
  ].sort() as string[];
  const moeglich = speichernMoeglich();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={neu ? "/verwaltung" : `/termin/${encodeURIComponent(t.id)}`}
          className="inline-flex items-center gap-1.5 text-sm text-grau hover:text-marke-700"
        >
          <I icon={ArrowLeft} className="size-4" />
          Abbrechen
        </Link>
        {!neu && <span className="text-sm text-grau">{datumKurz(t.datum)}</span>}
      </div>
      <h1 className="font-serif lining-nums text-3xl font-semibold">{neu ? "Neuer Termin" : "Termin bearbeiten"}</h1>

      {moeglich !== true && (
        <p className="flex items-start gap-2 rounded-lg border border-marke-200 bg-marke-50 p-3.5 text-sm text-marke-800">
          <I icon={TriangleAlert} className="mt-0.5 size-4" />
          {moeglich}
        </p>
      )}

      <datalist id="orte">
        {orte.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <datalist id="programme">
        {programme.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <form action={terminSpeichern} className="space-y-5">
        <input type="hidden" name="id" value={t.id} />

        <Abschnitt titel="Was & wann">
          <Feld label="Titel">
            <input name="titel" required defaultValue={t.titel} className={FELD} />
          </Feld>
          <div className="grid grid-cols-2 gap-3">
            <Feld label="Datum">
              <input type="date" name="datum" required defaultValue={t.datum} className={FELD} />
            </Feld>
            <Feld label="Status">
              <Wahl
                name="status"
                wert={t.status}
                optionen={[
                  ["bestaetigt", "bestätigt"],
                  ["vorbehalt", "Vorbehalt"],
                ]}
              />
            </Feld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Feld label="Treffzeit">
              <input type="time" name="treffzeit" defaultValue={t.treffzeit ?? ""} className={FELD} />
            </Feld>
            <Feld label="Treffpunkt">
              <input name="treffpunkt" list="orte" defaultValue={t.treffpunkt ?? ""} className={FELD} />
            </Feld>
            <Feld label="Beginn">
              <input type="time" name="beginn" defaultValue={t.beginn ?? ""} className={FELD} />
            </Feld>
            <Feld label="Ort (falls anders)">
              <input name="ort" list="orte" defaultValue={t.ort ?? ""} className={FELD} />
            </Feld>
            <Feld label="Ende (optional)">
              <input type="time" name="ende" defaultValue={t.ende ?? ""} className={FELD} />
            </Feld>
            <Feld label="Im Anschluss an">
              <select name="anschluss_an" defaultValue={t.anschluss_an ?? ""} className={FELD}>
                <option value="">–</option>
                {sameDay.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.titel}
                  </option>
                ))}
              </select>
            </Feld>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Feld label="Veranstalter">
              <input name="veranstalter" defaultValue={t.veranstalter ?? ""} className={FELD} />
            </Feld>
            <Feld label="Intern / Extern">
              <Wahl
                name="art"
                wert={t.art}
                optionen={[
                  ["intern", "Intern"],
                  ["extern", "Extern"],
                ]}
              />
            </Feld>
          </div>
          <Feld label="Tagesprogramm" hilfe="Gleicher Name am selben Tag fasst Termine zusammen, z. B. „Weiberdonnerstag“.">
            <input name="tagesprogramm" list="programme" defaultValue={t.tagesprogramm ?? ""} className={FELD} />
          </Feld>
        </Abschnitt>

        <Abschnitt titel="Wer ist dabei?">
          <GruppenAuswahl
            umfang={t.umfang}
            ausgewaehlt={t.gruppen}
            gruppen={daten.gruppen.map((g) => ({
              id: g.id,
              name: g.name,
              kuerzel: g.kuerzel,
              in_alle: g.in_alle,
              personen: g.personen,
            }))}
          />
          <p className="text-xs text-grau">
            Gruppen anlegen und Personenzahl pflegen unter{" "}
            <Link href="/verwaltung/gruppen" className="underline">
              Verwaltung → Gruppen
            </Link>
            .
          </p>
        </Abschnitt>

        <Abschnitt titel="Karten / Anmeldung">
          <Wahl
            name="anmeldung"
            wert={t.anmeldung ?? ""}
            optionen={[
              ["", "Nicht nötig"],
              ["eintrittskarte", "Eintrittskarte"],
              ["voranmeldung", "Voranmeldung"],
            ]}
          />
          <Feld label="Bereits bestellt / angemeldet (Anzahl)">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              name="karten_bestellt"
              defaultValue={t.karten_bestellt ?? ""}
              className={FELD}
            />
          </Feld>
        </Abschnitt>

        <Abschnitt titel="Hinweise">
          <Feld label="Wichtiger Hinweis" hilfe="Wird rot hervorgehoben, z. B. „Abfahrt 12:00 Uhr!“">
            <input name="hinweis" defaultValue={t.hinweis ?? ""} className={FELD} />
          </Feld>
          <Feld label="Bemerkung">
            <textarea name="bemerkung" rows={2} defaultValue={t.bemerkung ?? ""} className={FELD} />
          </Feld>
          <Feld label="Noch prüfen" hilfe="Offene Frage – leeren, sobald geklärt.">
            <input name="pruefen" defaultValue={t.pruefen ?? ""} className={FELD} />
          </Feld>
        </Abschnitt>

        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-linie bg-papier/95 px-4 py-3 backdrop-blur">
          <button
            type="submit"
            disabled={moeglich !== true}
            className="flex-1 rounded-md bg-marke-700 px-4 py-3 font-semibold text-white hover:bg-marke-800 disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </form>

      {!neu && moeglich === true && (
        <form action={terminLoeschen} className="flex justify-end">
          <input type="hidden" name="id" value={t.id} />
          <LoeschenKnopf frage={`„${t.titel}“ am ${datumKurz(t.datum)} wirklich löschen?`}>
            <I icon={Trash2} className="size-4" />
            Termin löschen
          </LoeschenKnopf>
        </form>
      )}
    </div>
  );
}
