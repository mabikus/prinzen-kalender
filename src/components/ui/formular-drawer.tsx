"use client";

import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./cn";
import { useKeyboardInset } from "./keyboard";
import { useConfirm } from "./overlay";

/**
 * Der eine Formular-Drawer der Verwaltung (wie KBN): rechts schwebend am PC, am Handy Blatt von unten.
 * Kopf mit kleiner Zeile (`oben`), großem Titel und eigenen Knöpfen (`kopf`); unten fest die Leiste (`fuss`).
 * `geaendert`: Schließen fragt „Verwerfen?“.
 */
export function FormularDrawer({
  offen,
  schliessen,
  oben,
  titel,
  kopf,
  fuss,
  geaendert,
  breite = 600,
  children,
}: {
  offen: boolean;
  schliessen: () => void;
  oben?: ReactNode;
  titel: ReactNode;
  kopf?: ReactNode;
  /** Leiste unten; als Funktion bekommt sie `abbrechen` (fragt bei Änderungen „Verwerfen?“) */
  fuss: ReactNode | ((abbrechen: () => void) => ReactNode);
  geaendert?: boolean;
  breite?: number;
  children: ReactNode;
}) {
  useKeyboardInset(offen);
  const confirm = useConfirm();
  const zu = async () => {
    if (
      geaendert &&
      !(await confirm({
        title: "Änderungen verwerfen?",
        description: "Was du eingegeben hast, wird nicht gespeichert.",
        confirmLabel: "Verwerfen",
        destructive: true,
      }))
    )
      return;
    schliessen();
  };

  return (
    <D.Root open={offen} onOpenChange={(o) => !o && void zu()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          onPointerDownOutside={(e) => {
            e.preventDefault();
            void zu();
          }}
          onOpenAutoFocus={(e) => {
            // Am Handy nicht gleich die Tastatur aufklappen
            if (window.matchMedia("(pointer: coarse)").matches) e.preventDefault();
          }}
          style={{ ["--drawer-breite" as string]: `${breite}px` }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-bg shadow-[var(--shadow-pop)] outline-none",
            "inset-x-0 bottom-[var(--keyboard-inset,0px)] top-[max(env(safe-area-inset-top),0.5rem)] rounded-t-[18px] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=open]:duration-300",
            "sm:inset-x-auto sm:bottom-2 sm:right-2 sm:top-2 sm:w-[min(var(--drawer-breite),calc(100vw-1rem))] sm:rounded-[18px] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-right-10",
          )}
        >
          <header className="flex shrink-0 items-start gap-1 border-b border-line bg-panel px-5 pb-4 pt-4">
            <div className="min-w-0 flex-1">
              {oben ? <p className="truncate text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink">{oben}</p> : null}
              <D.Title className="mt-0.5 truncate font-display text-[21px] font-bold tracking-[-0.01em] text-ink">{titel}</D.Title>
              <D.Description className="sr-only">{typeof titel === "string" ? titel : "Formular"}</D.Description>
            </div>
            {kopf}
            <Button variant="ghost" size="icon-sm" aria-label="Schließen" onClick={() => void zu()}>
              <X />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-5 sm:px-5">{children}</div>
          <footer className="flex shrink-0 items-center gap-2 border-t border-line bg-panel px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-3">
            {typeof fuss === "function" ? fuss(() => void zu()) : fuss}
          </footer>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
