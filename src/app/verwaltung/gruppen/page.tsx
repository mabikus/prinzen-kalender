import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoeschenKnopf } from "@/components/loeschen";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { FARBEN, FARBLISTE, gruppeDabei } from "@/lib/labels";
import type { Gruppe } from "@/lib/types";
import { gruppeLoeschen, gruppeSpeichern } from "../aktionen";

export const metadata = { title: "Gruppen" };

export default function Seite() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-zinc-500">Lade …</p>}>
      <Gruppen />
    </Suspense>
  );
}

const FELD =
  "w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-base dark:border-zinc-700 dark:bg-zinc-950";

function GruppenFormular({ g, anzahlTermine, moeglich }: { g?: Gruppe; anzahlTermine?: number; moeglich: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <form action={gruppeSpeichern} className="space-y-3">
        <input type="hidden" name="id" value={g?.id ?? ""} />
        <div className="flex items-center gap-2">
          {g && <span className={`size-3 shrink-0 rounded-full ${FARBEN[g.farbe].punkt}`} />}
          <h2 className="font-semibold">{g ? g.name : "Neue Gruppe"}</h2>
          {g && <span className="ml-auto text-xs text-zinc-500">{anzahlTermine} Termine · Abo: {g.id}.ics</span>}
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Kürzel</span>
            <input name="kuerzel" defaultValue={g?.kuerzel ?? ""} className={FELD} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Name</span>
            <input name="name" required defaultValue={g?.name ?? ""} className={FELD} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Beschreibung / wer gehört dazu</span>
          <input name="beschreibung" defaultValue={g?.beschreibung ?? ""} className={FELD} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Personen</span>
            <input type="number" min={0} inputMode="numeric" name="personen" defaultValue={g?.personen ?? ""} className={FELD} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Farbe</span>
            <select name="farbe" defaultValue={g?.farbe ?? "blau"} className={FELD}>
              {FARBLISTE.map((f) => (
                <option key={f} value={f}>
                  {FARBEN[f].name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Reihenfolge</span>
            <input type="number" inputMode="numeric" name="sortierung" defaultValue={g?.sortierung ?? ""} className={FELD} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="in_alle" defaultChecked={g?.in_alle ?? true} className="size-4 accent-red-700" />
          Gehört zu „Alle“ / „Jeder Verfügbare“
          <span className="text-xs text-zinc-500">(z. B. Familie: nein)</span>
        </label>
        <button
          type="submit"
          disabled={!moeglich}
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {g ? "Speichern" : "Gruppe anlegen"}
        </button>
      </form>
      {g && moeglich && (
        <form action={gruppeLoeschen} className="flex justify-end">
          <input type="hidden" name="id" value={g.id} />
          <LoeschenKnopf frage={`Gruppe „${g.name}“ löschen? Sie wird bei allen Terminen entfernt.`} />
        </form>
      )}
    </div>
  );
}

async function Gruppen() {
  if (!(await darfBearbeiten())) redirect("/verwaltung");
  const daten = await ladeDaten();
  const moeglich = speichernMoeglich();

  return (
    <div className="space-y-6">
      <Link href="/verwaltung" className="text-sm text-zinc-500 hover:underline">
        ← Verwaltung
      </Link>
      <h1 className="text-2xl font-bold">Gruppen</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Hier legt ihr fest, welche Gruppen es gibt. Bei jedem Termin wählt ihr dann „Alle“, „Jeder Verfügbare“
        oder einzelne Gruppen. Die Personenzahl wird für die Eintrittskarten zusammengerechnet.
      </p>
      {moeglich !== true && (
        <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900 dark:bg-orange-950 dark:text-orange-200">
          {moeglich}
        </p>
      )}
      <div className="space-y-3">
        {daten.gruppen.map((g) => (
          <GruppenFormular
            key={g.id}
            g={g}
            moeglich={moeglich === true}
            anzahlTermine={daten.termine.filter((t) => gruppeDabei(t, g)).length}
          />
        ))}
        <GruppenFormular moeglich={moeglich === true} />
      </div>
    </div>
  );
}
