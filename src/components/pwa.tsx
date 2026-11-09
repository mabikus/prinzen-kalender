"use client";

import { useEffect } from "react";

/** Meldet den Service Worker an (nur im Produktivbetrieb). */
export function DienstHelfer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
