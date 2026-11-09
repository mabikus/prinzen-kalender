import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Plus, Trash2, TriangleAlert } from "lucide-react";
import { LoeschenKnopf } from "@/components/loeschen";
import { I } from "@/components/termin";
import { darfBearbeiten } from "@/lib/bearbeiten";
import { ladeDaten, speichernMoeglich } from "@/lib/daten";
import { gruppeDabei } from "@/lib/labels";
import type { Gruppe } from "@/lib/types";
import { gruppeLoeschen, gruppeSpeichern } from "../aktionen";

export const metadata = { title: "Gruppen" };

export default function Seite() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-grau">Lade …</p>}>
      <Gruppen />
    </Suspense>
  );
}

const FELD =
  "w-full rounded-md border border-linie bg-white px-2.5 py-1.5 text-base outline-none focus:border-marke-300 focus:ring-2 focus:ring-marke-100";

function GruppenFormular({ g, anzahlTermine, moeglich }: { g?: Gruppe; anzahlTermine?: number; moeglich: boolean }) {
  return (
    <div className={`space-y-3 rounded-lg border bg-white p-4 ${g ? "border-linie" : "border-dashed border-marke-300"}`}>
      <form action={gruppeSpeichern} className="space-y-3">
        <input type="hidden" name="id" value={g?.id ?? ""} />
        {/* Farbe wird in der Oberfläche nicht mehr verwendet, bleibt aber erhalten */}
        <input type="hidden" name="farbe" value={g?.farbe ?? "grau"} />
        <div className="flex items-center gap-3">
          {g ? (
            <span className="flex h-7 min-w-9 items-center justify-center rounded bg-marke-700 px-1.5 text-xs font-bold text-white">
              {g.kuerzel}
            </span>
          ) : (
            <I icon={Plus} className="size-5 text-marke-700" />
          )}
          <h2 className="font-serif lining-nums text-lg font-semibold">{g ? g.name : "Neue Gruppe"}</h2>
          {g && <span className="ml-auto text-xs text-grau">{anzahlTermine} Termine</span>}
        </div>
        <div className="grid grid-cols-[5rem_1fr] gap-2">
          <label className="space-y-1">
            <span className="text-xs text-grau">Kürzel</span>
            <input name="kuerzel" defaultValue={g?.kuerzel ?? ""} className={FELD} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-grau">Name</span>
            <input name="name" required defaultValue={g?.name ?? ""} className={FELD} />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-grau">Beschreibung / wer gehört dazu</span>
          <input name="beschreibung" defaultValue={g?.beschreibung ?? ""} className={FELD} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-grau">Personen</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              name="personen"
              defaultValue={g?.personen ?? ""}
              className={FELD}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-grau">Reihenfolge</span>
            <input type="number" inputMode="numeric" name="sortierung" defaultValue={g?.sortierung ?? ""} className={FELD} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="in_alle" defaultChecked={g?.in_alle ?? true} className="size-4 accent-marke-700" />
          Gehört zu „Alle“ / „Jeder Verfügbare“
          <span className="text-xs text-grau">(z. B. Familie: nein)</span>
        </label>
        <button
          type="submit"
          disabled={!moeglich}
          className="rounded-md bg-marke-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-marke-800 disabled:opacity-50"
        >
          {g ? "Speichern" : "Gruppe anlegen"}
        </button>
      </form>
      {g && moeglich && (
        <form action={gruppeLoeschen} className="flex justify-end">
          <input type="hidden" name="id" value={g.id} />
          <LoeschenKnopf frage={`Gruppe „${g.name}“ löschen? Sie wird bei allen Terminen entfernt.`}>
            <I icon={Trash2} className="size-4" />
            Löschen
          </LoeschenKnopf>
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
      <Link href="/verwaltung" className="inline-flex items-center gap-1.5 text-sm text-grau hover:text-marke-700">
        <I icon={ArrowLeft} className="size-4" />
        Verwaltung
      </Link>
      <header className="space-y-2 border-b border-linie pb-4">
        <h1 className="font-serif lining-nums text-4xl font-semibold">Gruppen</h1>
        <p className="text-sm text-tinte/75">
          Hier legt ihr fest, welche Gruppen es gibt. Bei jedem Termin wählt ihr dann „Alle“, „Jeder Verfügbare“ oder
          einzelne Gruppen. Die Personenzahl wird für die Eintrittskarten zusammengerechnet.
        </p>
      </header>
      {moeglich !== true && (
        <p className="flex items-start gap-2 rounded-lg border border-marke-200 bg-marke-50 p-3.5 text-sm text-marke-800">
          <I icon={TriangleAlert} className="mt-0.5 size-4" />
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
