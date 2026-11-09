"use client";

import { useSyncExternalStore } from "react";

// Handy-Bauform für Dialoge (ScreenDialog als Vollbild-Seite, Bestätigung als Action-Sheet): schmal (unter `sm`), ein
// Handy quer (Touch, wenig Höhe) oder die native App auf einem Handy. Tablet und Desktop: Dialog wie gehabt.

export const PHONE_QUERY = "(max-width: 639px), (pointer: coarse) and (max-height: 500px)";

/**
 * Plattform der nativen App – `html[data-native]`, gesetzt von initNative() in der Web-App (lib/native.ts, einzige
 * Stelle, die Capacitor kennt). Im Browser null.
 */
export function nativePlatform(): "ios" | "android" | "app" | null {
  if (typeof document === "undefined") return null;
  const v = document.documentElement.dataset.native;
  if (v === undefined) return null;
  return v === "ios" || v === "android" ? v : "app";
}

/** iPhone/iPad (auch iPadOS mit Desktop-Kennung). */
export function isAppleTouch(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Als App vom Home-Bildschirm gestartet (PWA) – dort gibt es keine Wisch-Geste des Browsers. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isPhoneLayout(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  if (window.matchMedia(PHONE_QUERY).matches) return true;
  // Native App auf einem Handy (kürzere Seite unter 600 pt) – auch quer
  return nativePlatform() !== null && Math.min(window.screen.width, window.screen.height) < 600;
}

function subscribe(cb: () => void) {
  const m = window.matchMedia(PHONE_QUERY);
  m.addEventListener("change", cb);
  window.addEventListener("orientationchange", cb);
  return () => {
    m.removeEventListener("change", cb);
    window.removeEventListener("orientationchange", cb);
  };
}

/** Handy-Bauform als Zustand (siehe isPhoneLayout). */
export function usePhoneLayout(): boolean {
  return useSyncExternalStore(subscribe, isPhoneLayout, () => false);
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
