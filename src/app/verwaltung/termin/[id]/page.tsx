import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { GruppenAuswahl } from "@/components/gruppen-auswahl";
import { LoeschenKnopf } from "@/components/loeschen";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { FARBEN } from "@/lib/labels";
import type { Termin } from "@/lib/types";
import { datumKurz } from "@/lib/zeit";
import { terminLoeschen, terminSpeichern } from "../../aktionen";

export const metadata = { title: "Termin bearbeiten" };

export default function Seite(props: PageProps<"/verwaltung/termin/[id]">) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Lade …</p>}>
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
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-950";

function Feld({ label, hilfe, children }: { label: string; hilfe?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hilfe && <span className="block text-xs text-zinc-500">{hilfe}</span>}
    </label>
  );
}

function Wahl({ name, wert, optionen }: { name: string; wert: string; optionen: [string, string][] }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
      {optionen.map(([v, label]) => (
        <label
          key={v}
          className="flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-center text-sm font-medium text-zinc-600 has-checked:bg-white has-checked:text-zinc-900 has-checked:shadow dark:text-zinc-300 dark:has-checked:bg-zinc-950 dark:has-checked:text-white"
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
    <fieldset className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">{titel}</legend>
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
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Abbrechen
        </Link>
        {!neu && <span className="text-sm text-zinc-500">{datumKurz(t.datum)}</span>}
      </div>
      <h1 className="text-2xl font-bold">{neu ? "Neuer Termin" : "Termin bearbeiten"}</h1>

      {moeglich !== true && (
        <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200">
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
              badge: FARBEN[g.farbe].badge,
              in_alle: g.in_alle,
              personen: g.personen,
            }))}
          />
          <p className="text-xs text-zinc-500">
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
              ["eintrittskarte", "🎟️ Eintrittskarte"],
              ["voranmeldung", "📝 Voranmeldung"],
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

        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <button
            type="submit"
            disabled={moeglich !== true}
            className="flex-1 rounded-xl bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </form>

      {!neu && moeglich === true && (
        <form action={terminLoeschen} className="flex justify-end">
          <input type="hidden" name="id" value={t.id} />
          <LoeschenKnopf frage={`„${t.titel}“ am ${datumKurz(t.datum)} wirklich löschen?`}>Termin löschen</LoeschenKnopf>
        </form>
      )}
    </div>
  );
}
