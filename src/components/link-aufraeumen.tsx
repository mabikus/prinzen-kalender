"use client";

import { useEffect } from "react";

/** Entfernt das Zugangs-Token (?k=…) nach dem Öffnen des Einladungslinks aus der Adresszeile – das Cookie ist gesetzt. */
export function LinkAufraeumen() {
  useEffect(() => {
    const u = new URL(window.location.href);
    if (!u.searchParams.has("k")) return;
    u.searchParams.delete("k");
    window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
  }, []);
  return null;
}
