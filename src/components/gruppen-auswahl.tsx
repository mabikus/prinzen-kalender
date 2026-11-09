"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Umfang } from "@/lib/types";

interface G {
  id: string;
  name: string;
  kuerzel: string;
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
      <div className="grid grid-cols-3 gap-1 rounded-md bg-papier p-1 ring-1 ring-inset ring-linie">
        {MODI.map((m) => (
          <label
            key={m.wert}
            title={m.hilfe}
            className={`cursor-pointer rounded px-2 py-2 text-center text-sm font-semibold transition ${
              umfang === m.wert
                ? m.wert === "auswahl"
                  ? "bg-white text-marke-800 shadow-sm ring-1 ring-marke-200"
                  : "bg-marke-700 text-white shadow-sm"
                : "text-grau hover:text-marke-700"
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
              className={`flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                an ? "bg-marke-50 text-marke-900 ring-marke-300" : "bg-white text-grau ring-linie hover:ring-marke-200"
              } ${auto ? "cursor-default opacity-75" : ""}`}
            >
              <input
                type="checkbox"
                name={auto ? undefined : "gruppen"}
                value={g.id}
                checked={an}
                disabled={auto}
                onChange={() => umschalten(g.id)}
                className="peer sr-only"
              />
              <span
                className={`flex size-4 items-center justify-center rounded-sm ring-1 ring-inset peer-focus-visible:ring-2 ${
                  an ? "bg-marke-700 text-white ring-marke-700" : "bg-white ring-linie"
                }`}
              >
                {an && <Check className="size-3" strokeWidth={2.5} aria-hidden />}
              </span>
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
              className="text-marke-700 underline underline-offset-2"
            >
              alle ankreuzen
            </button>
            <button type="button" onClick={() => setAuswahl(new Set())} className="text-grau underline underline-offset-2">
              keine
            </button>
          </>
        )}
        <span className="ml-auto text-grau">
          ca. <strong className="tabular-nums text-tinte">{personen}</strong> Personen
        </span>
      </div>
    </div>
  );
}
