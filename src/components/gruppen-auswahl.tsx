"use client";

import { useState } from "react";
import type { Umfang } from "@/lib/types";

interface G {
  id: string;
  name: string;
  kuerzel: string;
  badge: string;
  in_alle: boolean;
  personen: number | null;
}

const MODI: { wert: Umfang; label: string; hilfe: string }[] = [
  { wert: "alle", label: "Alle", hilfe: "Alle Gruppen sind dabei" },
  { wert: "jeder_verfuegbare", label: "Jeder Verfügbare", hilfe: "Alle, die können („Viele Hände …“)" },
  { wert: "auswahl", label: "Auswahl", hilfe: "Nur die angekreuzten Gruppen" },
];

/** Wer ist dabei? Schnellbuttons "Alle" / "Jeder Verfügbare" oder einzelne Gruppen ankreuzen. */
export function GruppenAuswahl({
  gruppen,
  umfang: start,
  ausgewaehlt,
}: {
  gruppen: G[];
  umfang: Umfang;
  ausgewaehlt: string[];
}) {
  const [umfang, setUmfang] = useState<Umfang>(start);
  const [auswahl, setAuswahl] = useState(new Set(ausgewaehlt));

  const automatisch = (g: G) => umfang !== "auswahl" && g.in_alle;
  const umschalten = (id: string) =>
    setAuswahl((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const personen = gruppen
    .filter((g) => automatisch(g) || auswahl.has(g.id))
    .reduce((s, g) => s + (g.personen ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {MODI.map((m) => (
          <label
            key={m.wert}
            title={m.hilfe}
            className={`cursor-pointer rounded-lg px-2 py-2 text-center text-sm font-semibold ${
              umfang === m.wert
                ? m.wert === "alle"
                  ? "bg-red-600 text-white shadow"
                  : m.wert === "jeder_verfuegbare"
                    ? "bg-zinc-700 text-white shadow"
                    : "bg-white shadow dark:bg-zinc-950"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            <input
              type="radio"
              name="umfang"
              value={m.wert}
              checked={umfang === m.wert}
              onChange={() => setUmfang(m.wert)}
              className="sr-only"
            />
            {m.label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {gruppen.map((g) => {
          const auto = automatisch(g);
          const an = auto || auswahl.has(g.id);
          return (
            <label
              key={g.id}
              className={`flex cursor-pointer select-none items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                an ? g.badge : "bg-white text-zinc-500 ring-zinc-300 dark:bg-zinc-900 dark:ring-zinc-700"
              } ${auto ? "cursor-default opacity-80" : ""}`}
            >
              <input
                type="checkbox"
                name={auto ? undefined : "gruppen"}
                value={g.id}
                checked={an}
                disabled={auto}
                onChange={() => umschalten(g.id)}
                className="size-4 accent-red-700"
              />
              {g.name}
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {umfang === "auswahl" && (
          <>
            <button
              type="button"
              onClick={() => setAuswahl(new Set(gruppen.filter((g) => g.in_alle).map((g) => g.id)))}
              className="text-red-700 underline dark:text-red-400"
            >
              alle ankreuzen
            </button>
            <button type="button" onClick={() => setAuswahl(new Set())} className="text-zinc-500 underline">
              keine
            </button>
          </>
        )}
        <span className="ml-auto text-zinc-500">≈ {personen} Personen</span>
      </div>
    </div>
  );
}
