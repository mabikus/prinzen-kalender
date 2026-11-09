/** Gespeicherte Wahl im Browser: "hell" | "dunkel" (ohne Eintrag: wie das Gerät) */
export const FARBSCHEMA_SPEICHER = "farbschema";

/**
 * Läuft als Inline-Skript im <head> vor dem ersten Bild und setzt data-theme an <html>:
 * gespeicherte Wahl, sonst Einstellung des Geräts (und folgt ihr, solange nichts gewählt ist).
 * So blitzt beim Laden nichts hell auf.
 */
export const FARBSCHEMA_SKRIPT = `(function(){try{var k="${FARBSCHEMA_SPEICHER}",m=matchMedia("(prefers-color-scheme: dark)"),h=document.documentElement;function s(){var w=localStorage.getItem(k);h.dataset.theme=(w?w==="dunkel":m.matches)?"dark":"light"}s();m.addEventListener("change",s)}catch(e){}})()`;
