"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Kleiner Kopier-Knopf im Termin-Blatt: Titel, Datum, Treffen/Beginn mit Ort – zum Weitergeben per WhatsApp & Co. */
export function DetailsKopieren({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ältere Browser: über ein unsichtbares Textfeld
      const feld = document.createElement("textarea");
      feld.value = text;
      feld.setAttribute("readonly", "");
      feld.style.position = "fixed";
      feld.style.opacity = "0";
      document.body.appendChild(feld);
      feld.select();
      document.execCommand("copy");
      feld.remove();
    }
    setOk(true);
    window.setTimeout(() => setOk(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={() => void kopieren()}
      aria-label={ok ? "Kopiert" : "Details kopieren"}
      title="Details kopieren"
      className={`ml-auto inline-flex h-8 items-center gap-1 rounded-full px-2 normal-case tracking-normal transition-colors ${
        ok ? "bg-marke-50 text-marke-700" : "text-grau active:bg-stone-100"
      }`}
    >
      {ok ? <Check className="size-[18px]" strokeWidth={2} /> : <Copy className="size-[18px]" strokeWidth={1.75} />}
      {ok ? <span className="text-[13px] font-semibold">Kopiert</span> : null}
    </button>
  );
}
