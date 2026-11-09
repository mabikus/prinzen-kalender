"use client";

import { useSyncExternalStore } from "react";

/** Passt eine Media-Query (z. B. "(max-width: 639px)")? Auf dem Server immer false. */
export function useMedien(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
