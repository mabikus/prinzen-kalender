"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Kopier-Knopf; `beschriftung` z. B. „PIN“ (Standard „Link“) */
export function Kopieren({ text, beschriftung = "Link" }: { text: string; beschriftung?: string }) {
  const [ok, setOk] = useState(false);
  const Icon = ok ? Check : Copy;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          window.prompt(`${beschriftung} kopieren:`, text);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-panel px-3 py-1.5 text-sm font-medium text-tinte ring-1 ring-inset ring-linie transition hover:text-marke-700 hover:ring-marke-300"
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      {ok ? "Kopiert" : beschriftung}
    </button>
  );
}
