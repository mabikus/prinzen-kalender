"use client";

import { useId, type ReactElement, type ReactNode, cloneElement, isValidElement } from "react";
import { cn } from "./cn";

/** Label über dem Feld, Hinweis darunter, Fehler ersetzt den Hinweis. Pflicht mit *. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactElement<Record<string, unknown>>;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string) ?? id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hint || error ? hintId : undefined,
      })
    : children;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={(children.props.id as string) ?? id} className="text-[13px] font-medium text-muted">
        {label}
        {required ? <span className="ml-0.5 text-accent-ink">*</span> : null}
      </label>
      {control}
      {error ? (
        <p id={hintId} role="alert" className="text-[12.5px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[12.5px] text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Einstellungszeile: Text links, Steuerelement rechts. */
export function SettingRow({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    // Kleine Bedienelemente (Schalter) bleiben auch auf dem Handy rechts neben dem Text; breite (Auswahl) rutschen darunter
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4 sm:flex-nowrap sm:gap-8">
      <div className="min-w-[min(100%,12rem)] flex-1">
        <div className="text-[14px] font-medium text-ink">{title}</div>
        {description ? <div className="mt-0.5 text-[13px] text-subtle">{description}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
