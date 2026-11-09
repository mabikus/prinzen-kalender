import type { ComponentProps } from "react";
import { cn } from "./cn";

const base =
  "ui-control w-full rounded-[var(--radius-control)] bg-elevated px-3 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] transition-shadow placeholder:text-subtle hover:shadow-[inset_0_0_0_1px_var(--subtle)] focus:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_var(--accent-soft)] disabled:opacity-50 aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)]";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(base, "h-9", className)} autoComplete={props.autoComplete ?? "off"} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(base, "min-h-24 py-2 leading-relaxed", className)} {...props} />;
}

export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(base, "h-9 appearance-none pr-8", className)} {...props} />;
}
