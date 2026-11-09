"use client";

import { useEffect, useState } from "react";

/**
 * Bildschirmtastatur (iPhone/Android): Abstand unten, sichtbare Höhe und Versatz oben als CSS-Variablen
 * `--keyboard-inset`, `--viewport-height` und `--viewport-top` am <html>, solange `active` – Bottom-Sheets und feste Eingabezeilen (Nachrichten im Kundenbereich)
 * rutschen damit über die Tastatur. iOS verkleinert beim Tippen nur den sichtbaren Bereich (visualViewport), Android mit
 * `interactive-widget=resizes-content` die ganze Seite – dann bleibt der Abstand 0 und feste Elemente wandern von selbst.
 * Mehrere Nutzer gleichzeitig (Dialog über der Nachrichten-Seite) teilen sich einen Zuhörer.
 */
let keyboardUsers = 0;
function updateKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) return;
  const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
  document.documentElement.style.setProperty("--viewport-height", `${Math.round(vv.height)}px`);
  // iOS schiebt den sichtbaren Bereich beim Tippen manchmal nach oben – Vollbild-Seiten (ScreenDialog) gehen mit
  document.documentElement.style.setProperty("--viewport-top", `${Math.max(0, Math.round(vv.offsetTop))}px`);
}

export function useKeyboardInset(active: boolean) {
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) return;
    if (keyboardUsers++ === 0) {
      vv.addEventListener("resize", updateKeyboardInset);
      vv.addEventListener("scroll", updateKeyboardInset);
    }
    updateKeyboardInset();
    return () => {
      if (--keyboardUsers > 0) return;
      vv.removeEventListener("resize", updateKeyboardInset);
      vv.removeEventListener("scroll", updateKeyboardInset);
      document.documentElement.style.removeProperty("--keyboard-inset");
      document.documentElement.style.removeProperty("--viewport-height");
      document.documentElement.style.removeProperty("--viewport-top");
    };
  }, [active]);
}

/** Textfeld (keine Häkchen, Knöpfe, Dateiauswahl) – dort erscheint die Bildschirmtastatur. */
function isTextField(el: Element | null) {
  return (
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement &&
      !["checkbox", "radio", "button", "submit", "file", "range", "color"].includes(el.type)) ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

/**
 * Tippt die Person gerade (Touch-Gerät, Fokus in einem Textfeld)? Dann läuft `useKeyboardInset` – feste Leisten
 * (Tab-Leiste des Kundenbereichs, Aktionsleiste der Anmeldung) richten sich nach `--keyboard-inset`.
 */
export function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;
    const onIn = (e: FocusEvent) => isTextField(e.target as Element) && setTyping(true);
    const onOut = () => window.setTimeout(() => setTyping(isTextField(document.activeElement)), 0);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  useKeyboardInset(typing);
  return typing;
}
