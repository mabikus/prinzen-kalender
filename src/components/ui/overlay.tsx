"use client";

import { Dialog as D, DropdownMenu as M, Popover as P } from "radix-ui";
import { AlertTriangle, X } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { Input } from "./input";
import { useKeyboardInset } from "./keyboard";
import { usePhoneLayout } from "./phone";

/**
 * Dialog: Klick daneben schließt nicht (Formulare gehen nicht verloren), Esc schon. `stacked`: über einem anderen Dialog
 * (z. B. Nachfrage aus einem offenen Seitenpanel) – liegt wie die Bestätigung darüber und dunkelt das Panel mit ab.
 *
 * Handy (schmaler als `sm`): Bottom-Sheet über die volle Breite (Seitenpanel: fast volle Höhe), Inhalt scrollt, Aktionen
 * bleiben unten fest – mit Abstand für die Home-Leiste (Safe-Area) und über der Bildschirmtastatur (useKeyboardInset).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 480,
  side,
  stacked,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  side?: "right";
  stacked?: boolean;
}) {
  useKeyboardInset(open);
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={cn("fixed inset-0 bg-black/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0", stacked ? "z-[60]" : "z-40")} />
        <D.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          style={{ maxWidth: width }}
          className={cn(
            "fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] mx-auto flex w-full flex-col rounded-t-[var(--radius-dialog)] bg-panel shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 sm:mx-0 sm:w-[calc(100vw-2rem)] sm:rounded-[var(--radius-dialog)]",
            stacked ? "z-[61]" : "z-50",
            side === "right"
              ? "top-[max(env(safe-area-inset-top),0.5rem)] sm:inset-x-auto sm:inset-y-2 sm:right-2 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-right-8"
              : "max-h-[calc(var(--viewport-height,100dvh)-max(env(safe-area-inset-top),0.75rem))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-[0.98]",
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
            <div className="min-w-0">
              <D.Title className="text-[16px] font-semibold text-ink">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-[13px] text-subtle">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Schließen" className="-mr-2 -mt-1">
                <X />
              </Button>
            </D.Close>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-5 sm:px-6", !footer && "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5")}>{children}</div>
          {footer ? (
            <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-4">{footer}</div>
          ) : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

interface ConfirmOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Unwiderrufliches: dieses Wort muss eingetippt werden. */
  typeToConfirm?: string;
}

const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(async () => false);

/** Statt window.confirm: const confirm = useConfirm(); if (await confirm({...})) … */
export function useConfirm() {
  return useContext(ConfirmCtx);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(v: boolean) => void>(() => {});
  const confirm = useCallback((o: ConfirmOptions) => {
    setTyped("");
    setOpts(o);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);
  const close = (v: boolean) => {
    resolver.current(v);
    setOpts(null);
  };
  const blocked = !!opts?.typeToConfirm && typed.trim() !== opts.typeToConfirm;
  // Handy: Action-Sheet von unten (iOS), sonst kleiner Dialog in der Mitte
  const phone = usePhoneLayout();
  useKeyboardInset(!!opts?.typeToConfirm);
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <D.Root open={!!opts} onOpenChange={(o) => !o && close(false)}>
        <D.Portal>
          <D.Overlay
            className={cn(
              "fixed inset-0 z-[60] data-[state=open]:animate-in data-[state=open]:fade-in-0",
              phone ? "bg-black/40" : "bg-black/55 backdrop-blur-[2px]",
            )}
          />
          {phone ? (
            // Handy: Action-Sheet wie iOS – unten, fest (nicht verschiebbar), Abbrechen getrennt darunter
            <D.Content
              onPointerDownOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] z-[61] mx-auto flex max-w-[480px] touch-none flex-col gap-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=open]:duration-300"
            >
              <div className="overflow-hidden rounded-[14px] bg-elevated shadow-[var(--shadow-pop)]">
                <div className="px-5 pb-4 pt-4 text-center">
                  <D.Title className="text-[15px] font-semibold text-ink">{opts?.title}</D.Title>
                  <D.Description className="mt-1 text-[13.5px] leading-snug text-muted">{opts?.description ?? ""}</D.Description>
                  {opts?.typeToConfirm ? (
                    <div className="mt-3 text-left">
                      <p className="mb-1.5 text-[13px] text-subtle">
                        Zum Bestätigen <span className="font-mono font-semibold text-ink">{opts.typeToConfirm}</span> eintippen
                      </p>
                      <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="touch-auto" />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={blocked}
                  onClick={() => close(true)}
                  className={cn(
                    "ui-control h-14 w-full border-t border-line text-[17px] font-semibold transition-colors active:bg-active disabled:opacity-40",
                    opts?.destructive ? "text-danger" : "text-accent-ink",
                  )}
                >
                  {opts?.confirmLabel ?? "Bestätigen"}
                </button>
              </div>
              <button
                type="button"
                data-confirm-cancel
                onClick={() => close(false)}
                className="ui-control h-14 w-full rounded-[14px] bg-elevated text-[17px] font-semibold text-ink shadow-[var(--shadow-pop)] transition-colors active:bg-active"
              >
                {opts?.cancelLabel ?? "Abbrechen"}
              </button>
            </D.Content>
          ) : (
            <D.Content
              onPointerDownOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                (document.querySelector("[data-confirm-cancel]") as HTMLElement | null)?.focus();
              }}
              className="fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-dialog)] bg-panel p-6 shadow-[var(--shadow-pop)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
            >
              <div className="flex gap-4">
                {opts?.destructive ? (
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-danger">
                    <AlertTriangle className="size-5" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <D.Title className="text-[16px] font-semibold text-ink">{opts?.title}</D.Title>
                  <D.Description className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{opts?.description ?? ""}</D.Description>
                  {opts?.typeToConfirm ? (
                    <div className="mt-4">
                      <p className="mb-1.5 text-[12.5px] text-subtle">
                        Zum Bestätigen <span className="font-mono font-semibold text-ink">{opts.typeToConfirm}</span> eintippen
                      </p>
                      <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button data-confirm-cancel onClick={() => close(false)}>
                  {opts?.cancelLabel ?? "Abbrechen"}
                </Button>
                <Button variant={opts?.destructive ? "danger" : "primary"} disabled={blocked} onClick={() => close(true)}>
                  {opts?.confirmLabel ?? "Bestätigen"}
                </Button>
              </div>
            </D.Content>
          )}
        </D.Portal>
      </D.Root>
    </ConfirmCtx.Provider>
  );
}

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({ className, align = "end", ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        collisionPadding={8}
        className={cn("z-50 min-w-48 rounded-[10px] bg-elevated p-1 shadow-[var(--shadow-pop)] data-[state=open]:animate-fade-in", className)}
        {...props}
      />
    </M.Portal>
  );
}

export function MenuItem({ className, destructive, ...props }: ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-ink outline-none pointer-coarse:py-2.5 data-[disabled]:opacity-45 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:text-subtle",
        destructive && "text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function MenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof M.CheckboxItem>) {
  return (
    <M.CheckboxItem
      className={cn("relative flex cursor-pointer select-none items-center gap-2.5 rounded-md py-2 pl-8 pr-2.5 text-[13.5px] text-ink outline-none pointer-coarse:py-2.5 data-[highlighted]:bg-hover", className)}
      onSelect={(e) => e.preventDefault()}
      {...props}
    >
      <M.ItemIndicator className="absolute left-2.5 text-accent-ink">✓</M.ItemIndicator>
      {children}
    </M.CheckboxItem>
  );
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof M.Label>) {
  return <M.Label className={cn("px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle", className)} {...props} />;
}

export function MenuSeparator() {
  return <M.Separator className="my-1 h-px bg-line" />;
}

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverAnchor = P.Anchor;
export function PopoverContent({ className, align = "start", ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={6}
        collisionPadding={8}
        className={cn("z-50 rounded-[12px] bg-elevated p-3 shadow-[var(--shadow-pop)] outline-none data-[state=open]:animate-fade-in", className)}
        {...props}
      />
    </P.Portal>
  );
}
