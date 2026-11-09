"use client";

import { Dialog as D } from "radix-ui";
import { Punkte } from "@/components/ui/laden";
import type { ReactNode } from "react";

/**
 * Formular-Blatt im Stil einer nativen App: oben „Abbrechen · Titel · Sichern“.
 * Handy: Vollbild von unten, mit Abstand für Notch und Home-Leiste. PC: großes Fenster in der Mitte.
 * Der Sichern-Knopf schickt das Formular mit der id `formId` ab.
 */
export function Blatt({
  offen,
  schliessen,
  titel,
  untertitel,
  formId,
  sichernText = "Sichern",
  laeuft,
  children,
}: {
  offen: boolean;
  schliessen: () => void;
  titel: string;
  untertitel?: string;
  formId: string;
  sichernText?: string;
  laeuft?: boolean;
  children: ReactNode;
}) {
  return (
    <D.Root open={offen} onOpenChange={(o) => !o && schliessen()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 top-[max(env(safe-area-inset-top),0.75rem)] z-50 flex flex-col overflow-hidden rounded-t-[16px] bg-bg shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=open]:duration-300 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[5vh] sm:max-h-[90vh] sm:w-[640px] sm:-translate-x-1/2 sm:rounded-[16px] sm:data-[state=open]:slide-in-from-bottom-4"
        >
          <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-panel px-2 py-2">
            <D.Close className="justify-self-start rounded-md px-2.5 py-2 text-[16px] text-accent-ink hover:bg-hover">Abbrechen</D.Close>
            <div className="min-w-0 text-center">
              <D.Title className="truncate text-[16px] font-semibold text-ink">{titel}</D.Title>
              {untertitel ? (
                <D.Description className="truncate text-[12.5px] text-subtle">{untertitel}</D.Description>
              ) : (
                <D.Description className="sr-only">{titel}</D.Description>
              )}
            </div>
            <button
              type="submit"
              form={formId}
              disabled={laeuft}
              className="inline-flex items-center gap-1.5 justify-self-end rounded-md px-2.5 py-2 text-[16px] font-semibold text-accent-ink hover:bg-hover"
            >
              {laeuft ? (
                <span className="relative inline-grid place-items-center">
                  <span className="ui-laden-text">{sichernText}</span>
                  <Punkte className="absolute" />
                </span>
              ) : (
                sichernText
              )}
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-5 sm:px-6">
            {children}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
