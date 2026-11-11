"use client";

import { useRouter } from "next/navigation";
import { terminDuplizieren, terminLoeschen, terminWiederherstellen } from "@/app/verwaltung/aktionen";
import { useConfirm } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";
import type { Termin } from "@/lib/types";
import { datumKurz } from "@/lib/zeit";

/** Gemeinsame Termin-Aktionen (Liste, Kalender): Löschen mit Rückfrage und „Rückgängig“, Duplizieren. */
export function useTerminAktionen(nachAenderung?: () => void) {
  const confirm = useConfirm();
  const router = useRouter();
  const neu = () => (nachAenderung ? nachAenderung() : router.refresh());

  return {
    async loeschen(t: Termin) {
      let absage = false;
      const ok = await confirm({
        title: "Termin löschen?",
        description: `„${t.titel}“ am ${datumKurz(t.datum)}`,
        confirmLabel: "Löschen",
        destructive: true,
        option: { label: "Absage mitteilen (Push an alle Geräte)", ergebnis: (an) => (absage = an) },
      });
      if (!ok) return false;
      const r = await terminLoeschen(t.id, absage);
      if (!r.ok) return void toast.error(r.fehler);
      toast.success("Termin gelöscht", {
        undo: async () => {
          const w = await terminWiederherstellen(r.daten);
          if (w.ok) neu();
          else toast.error(w.fehler);
        },
      });
      neu();
      return true;
    },
    async duplizieren(t: Termin, datum?: string) {
      const r = await terminDuplizieren(t.id, datum);
      if (!r.ok) return void toast.error(r.fehler);
      toast.success("Termin dupliziert");
      neu();
      return r.daten;
    },
  };
}
