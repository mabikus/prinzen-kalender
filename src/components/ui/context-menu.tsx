"use client";

import { ContextMenu as C } from "radix-ui";
import { Check, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "./cn";

// Kontextmenü (Rechtsklick) – gleiche Optik wie Menu/MenuItem aus overlay.tsx.

export const ContextMenu = C.Root;
export const ContextMenuTrigger = C.Trigger;
export const ContextMenuSub = C.Sub;
export const ContextMenuRadioGroup = C.RadioGroup;

const inhalt =
  "z-50 min-w-48 rounded-[10px] bg-elevated p-1 shadow-[var(--shadow-pop)] data-[state=open]:animate-fade-in";
const eintrag =
  "relative flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-ink outline-none data-[disabled]:opacity-45 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-subtle";

export function ContextMenuContent({ className, ...props }: ComponentProps<typeof C.Content>) {
  return (
    <C.Portal>
      <C.Content collisionPadding={8} className={cn(inhalt, className)} {...props} />
    </C.Portal>
  );
}

export function ContextMenuItem({
  className,
  destructive,
  ...props
}: ComponentProps<typeof C.Item> & { destructive?: boolean }) {
  return <C.Item className={cn(eintrag, destructive && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function ContextMenuRadioItem({ className, children, ...props }: ComponentProps<typeof C.RadioItem>) {
  return (
    <C.RadioItem className={cn(eintrag, "pl-8", className)} {...props}>
      <C.ItemIndicator className="absolute left-2.5 inline-flex">
        <Check className="!size-3.5 !text-accent-ink" />
      </C.ItemIndicator>
      {children}
    </C.RadioItem>
  );
}

export function ContextMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof C.SubTrigger>) {
  return (
    <C.SubTrigger className={cn(eintrag, "data-[state=open]:bg-hover", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto !size-3.5" />
    </C.SubTrigger>
  );
}

export function ContextMenuSubContent({ className, ...props }: ComponentProps<typeof C.SubContent>) {
  return (
    <C.Portal>
      <C.SubContent sideOffset={4} collisionPadding={8} className={cn(inhalt, className)} {...props} />
    </C.Portal>
  );
}

export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof C.Label>) {
  return (
    <C.Label
      className={cn("px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle", className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator() {
  return <C.Separator className="my-1 h-px bg-line" />;
}

/** Tastenkürzel rechts im Menüeintrag */
export function ContextMenuShortcut({ children }: { children: React.ReactNode }) {
  return <span className="ml-auto pl-4 font-mono text-[11px] tracking-wider text-subtle">{children}</span>;
}
