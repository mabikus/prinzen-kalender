"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pinFreischalten, pinSperren } from "@/app/(oeffentlich)/pin-aktion";

/** PIN eingeben bzw. wieder sperren – danach Seiten neu laden, damit Liste, Monat und Abo stimmen */
export function PinFreischalten({ frei }: { frei: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();

  if (frei)
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href="/abo"
          className="inline-flex h-11 items-center rounded-full bg-marke-700 px-5 font-semibold text-white active:bg-marke-800"
        >
          Zum Kalender-Abo
        </Link>
        <button
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await pinSperren();
              router.refresh();
            })
          }
          className="inline-flex h-11 items-center rounded-full border border-linie px-5 font-semibold text-tinte active:bg-stone-100 disabled:opacity-60"
        >
          Wieder ausblenden
        </button>
      </div>
    );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setFehler(null);
        starte(async () => {
          const r = await pinFreischalten(pin);
          if (!r.ok) {
            setFehler(r.fehler);
            setPin("");
            return;
          }
          setPin("");
          router.refresh();
        });
      }}
    >
      <div className="flex gap-2">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
            setFehler(null);
          }}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="go"
          placeholder="PIN"
          aria-label="PIN"
          aria-invalid={fehler ? true : undefined}
          className={`h-12 min-w-0 flex-1 rounded-lg border bg-white px-4 text-center font-serif text-2xl tracking-[0.4em] tabular-nums outline-none placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-grau focus:border-marke-700 dark:bg-transparent ${
            fehler ? "border-marke-700" : "border-linie"
          }`}
        />
        <button
          type="submit"
          disabled={laeuft || pin.length < 4}
          className="h-12 shrink-0 rounded-lg bg-marke-700 px-5 font-semibold text-white active:bg-marke-800 disabled:opacity-50"
        >
          {laeuft ? "Prüfe …" : "Freischalten"}
        </button>
      </div>
      {fehler ? (
        <p role="alert" className="text-[15px] font-medium text-marke-700">
          {fehler}
        </p>
      ) : null}
    </form>
  );
}
