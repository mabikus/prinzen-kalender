"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Toaster as Sonner, toast as sonner } from "sonner";

/**
 * Ein Toast-Vertrag (Markus 26.10.2026: „unten rechts überdecken sie das Seitenpanel und das X geht nicht“): **oben mittig**
 * auf Desktop und Handy (unter Notch/Statusleiste), über allen Seitenpanels und Dialogen, jeder mit X, Wischen schließt
 * (hoch, links, rechts); Erfolg/Info 3 s (mit Rückgängig 6 s), Warnung 7 s, Fehler bleibt stehen.
 */
export const toast = {
  success: (msg: string, opts?: { description?: string; undo?: () => void }) =>
    sonner.success(msg, { description: opts?.description, duration: opts?.undo ? 6000 : 3000, action: opts?.undo ? { label: "Rückgängig", onClick: opts.undo } : undefined }),
  info: (msg: string, description?: string) => sonner(msg, { description, duration: 3000 }),
  warning: (msg: string, description?: string) => sonner.warning(msg, { description, duration: 7000 }),
  error: (msg: string, opts?: { description?: string; retry?: () => void }) =>
    sonner.error(msg, { description: opts?.description, duration: Infinity, closeButton: true, action: opts?.retry ? { label: "Erneut versuchen", onClick: opts.retry } : undefined }),
  /** Bleibt stehen, bis gehandelt oder geschlossen wird; gleiche id ersetzt statt zu stapeln. */
  action: (id: string, msg: string, opts: { description?: string; label: string; onClick: () => void }) =>
    sonner(msg, { id, description: opts.description, duration: Infinity, closeButton: true, action: { label: opts.label, onClick: opts.onClick } }),
};

/** Abstand oben: unter Notch bzw. Statusleiste (Safe-Area), sonst 12 px. */
const OBEN = "calc(12px + env(safe-area-inset-top))";

/**
 * Liegt ein Klick in einem Toast? Seitenpanels und Sheets (FilterSheet, ActionSheet) bleiben dann offen – das X oder
 * „Rückgängig“ eines Toasts ist kein „Klick daneben“. Für `onPointerDownOutside` von Radix.
 */
export function isToastTarget(target: EventTarget | null): boolean {
  return typeof Element !== "undefined" && target instanceof Element && !!target.closest("[data-sonner-toaster]");
}

export function Toaster({ theme = "light" }: { theme?: "light" | "dark" }) {
  // Erst nach dem Laden im Browser einhängen (kein Unterschied zwischen Server- und Browser-Ausgabe)
  const da = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!da) return null;
  // Direkt in <body> (nicht im App-Baum #root): so liegt die Liste über den Seiten und Panels, die Radix ebenfalls an
  // <body> hängt – auch während #root beim Öffnen einer Vollbild-Seite seitlich gleitet (eigene Ebene durch transform).
  // pointer-events: auto – ein offenes modales Panel sperrt sonst alle Klicks außerhalb (body { pointer-events: none }).
  return createPortal(
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: OBEN }}
      mobileOffset={{ top: OBEN, left: 12, right: 12 }}
      swipeDirections={["top", "left", "right"]}
      closeButton
      visibleToasts={3}
      style={{ pointerEvents: "auto" }}
      toastOptions={{
        classNames: {
          toast: "!bg-elevated !text-ink !shadow-[var(--shadow-pop)] !border-0 !rounded-[12px] !font-sans",
          description: "!text-subtle",
          actionButton: "!bg-accent !text-accent-fg",
          closeButton: "!bg-elevated !text-muted !border-[color:var(--line-strong)] hover:!text-ink",
        },
      }}
    />,
    document.body,
  );
}
