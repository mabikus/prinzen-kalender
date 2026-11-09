"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { FARBSCHEMA_SPEICHER as SPEICHER } from "@/lib/farbschema";

function umschalten() {
  const dunkel = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dunkel ? "dark" : "light";
  try {
    localStorage.setItem(SPEICHER, dunkel ? "dunkel" : "hell");
  } catch {
    // privates Fenster: gilt dann nur bis zum Neuladen
  }
}

/** Mond im hellen, Sonne im dunklen Design – per CSS, damit Server und Browser dasselbe zeigen */
export function FarbschemaKnopf({ className }: { className?: string }) {
  return (
    <button type="button" onClick={umschalten} aria-label="Hell oder dunkel umschalten" title="Hell / Dunkel" className={cn("grid size-10 place-items-center rounded-full", className)}>
      <Moon className="size-[20px] dark:hidden" strokeWidth={1.75} aria-hidden />
      <Sun className="hidden size-[21px] dark:block" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

/** Für Menüs: Beschriftung passend zum aktuellen Design */
export function FarbschemaText() {
  return (
    <>
      <span className="dark:hidden">Dunkles Design</span>
      <span className="hidden dark:inline">Helles Design</span>
    </>
  );
}

export { umschalten as farbschemaUmschalten };
