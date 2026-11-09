import type { ReactNode } from "react";
import { cn } from "./cn";

const widths = { narrow: "max-w-[820px]", default: "max-w-[1320px]", full: "max-w-none" } as const;

/** Seitenrahmen mit genau drei Breiten: narrow (Formulare), default (Übersichten), full (Listen). */
export function Page({ width, children, className }: { width: keyof typeof widths; children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full min-w-0 animate-fade-in px-4 py-5 sm:px-8 sm:py-7", widths[width], className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink">{eyebrow}</div> : null}
        <h1 className="font-display text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-[14px] text-subtle">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Karte mit Kopf (Titel, Beschreibung, Aktion) – für Einstellungen und Detailseiten. */
export function Section({
  title,
  description,
  action,
  children,
  footer,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)]", className)}>
      {title ? (
        // Aktion rechts neben dem Titel, wenn Platz ist – sonst darunter (statt den Text zu quetschen)
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-5 py-4">
          <div className="min-w-[min(100%,10rem)] flex-1">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-[13px] text-subtle">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
      {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer> : null}
    </section>
  );
}

export function PropertyList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[160px_1fr]">
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="text-[13px] text-subtle">{it.label}</dt>
          <dd className="min-w-0 text-[14px] text-ink">{it.value ?? <span className="text-subtle">–</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function KpiCard({ label, value, hint, icon, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "accent" }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-panel p-5 shadow-[inset_0_0_0_1px_var(--line)]">
      {tone === "accent" ? <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-accent opacity-[0.12] blur-2xl" /> : null}
      <div className="flex items-center justify-between text-[12.5px] font-medium text-subtle">
        {label}
        <span className="text-subtle [&_svg]:size-4">{icon}</span>
      </div>
      <div className="mt-2 font-display text-[30px] font-bold leading-none tracking-[-0.02em] text-ink tabular">{value}</div>
      {hint ? <div className="mt-2 text-[12.5px] text-subtle">{hint}</div> : null}
    </div>
  );
}
