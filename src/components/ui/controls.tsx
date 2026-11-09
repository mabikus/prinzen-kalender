"use client";

import { Checkbox as CheckboxPrimitive, Switch as SwitchPrimitive, Select as SelectPrimitive, Tooltip as TooltipPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "ui-hit relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full bg-line-strong transition-colors data-[state=checked]:bg-accent disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "ui-hit grid size-4 shrink-0 place-items-center rounded-[5px] shadow-[inset_0_0_0_1px_var(--line-strong)] transition-colors data-[state=checked]:bg-accent data-[state=checked]:shadow-none data-[state=indeterminate]:bg-accent",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-accent-fg">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export interface SelectOption {
  value: string;
  label: ReactNode;
  hint?: ReactNode;
}

/** Auswahl mit wenigen Werten (für viele Werte: SearchSelect). */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled,
  id,
  ...rest
}: {
  value: string | undefined;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        {...rest}
        className={cn(
          "ui-control flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] bg-elevated px-3 text-left text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--subtle)] focus:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_var(--accent-soft)] data-[placeholder]:text-subtle",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-subtle" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[10px] bg-elevated p-1 shadow-[var(--shadow-pop)] data-[state=open]:animate-fade-in"
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-[13.5px] text-ink outline-none data-[highlighted]:bg-hover"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2.5">
                  <Check className="size-3.5 text-accent-ink" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                {o.hint ? <span className="ml-auto pl-4 text-[12px] text-subtle">{o.hint}</span> : null}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-md bg-ink px-2 py-1 text-[12px] font-medium text-bg shadow-lg data-[state=delayed-open]:animate-fade-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export const TooltipProvider = TooltipPrimitive.Provider;

/** Segment-Schalter (z. B. Tag/Woche/Monat, Hell/Dunkel). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  size?: "sm" | "md";
  className?: string;
  /** Name der Auswahl für Screenreader (z. B. „Zeitraum“), wenn kein sichtbares Label daneben steht. */
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[var(--radius-control)] bg-elevated p-0.5 shadow-[inset_0_0_0_1px_var(--line)]", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[6px] px-3 font-medium text-subtle transition-colors hover:text-ink [&_svg]:size-3.5",
            size === "sm" ? "h-7 text-[12.5px]" : "h-8 text-[13px]",
            value === o.value && "bg-active text-ink shadow-[0_1px_2px_rgb(0_0_0/0.25)]",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
