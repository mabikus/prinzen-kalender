"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pinFreischalten, pinSperren } from "@/app/(oeffentlich)/pin-aktion";
import { pushAuffrischen } from "@/components/mitteilungen";

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
          className="inline-flex h-10 items-center rounded-full border border-linie px-4 text-[15px] font-semibold text-tinte active:bg-stone-100"
        >
          Zum Kalender-Abo
        </Link>
        <button
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              await pinSperren();
              // Mitteilungen zu vertraulichen Terminen ab jetzt nicht mehr an dieses Gerät
              await pushAuffrischen();
              router.refresh();
            })
          }
          className="inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold text-grau active:bg-stone-100 disabled:opacity-60"
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
          // Mitteilungen zu vertraulichen Terminen ab jetzt auch an dieses Gerät
          await pushAuffrischen();
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
          placeholder="Code"
          aria-label="Code"
          aria-invalid={fehler ? true : undefined}
          className={`h-11 min-w-0 flex-1 rounded-lg border bg-white px-4 text-center text-lg tracking-[0.3em] tabular-nums outline-none placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-grau focus:border-marke-700 dark:bg-transparent ${
            fehler ? "border-marke-700" : "border-linie"
          }`}
        />
        <button
          type="submit"
          disabled={laeuft || pin.length < 4}
          className="h-11 shrink-0 rounded-lg border border-linie px-4 font-semibold text-tinte active:bg-stone-100 disabled:opacity-50"
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
