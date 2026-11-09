import type { ComponentProps, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "./cn";

export type Tone = "neutral" | "success" | "warning" | "info" | "danger" | "accent";

/** Farbe je Ton (CSS-Variable) – für Punkte und Flächen in eigenen Bausteinen (z. B. Pills). */
export const toneColor: Record<Tone, string> = {
  neutral: "var(--subtle)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  danger: "var(--danger)",
  accent: "var(--accent)",
};

/** Status als Punkt + Text – Standard für Status in Tabellen. */
export function StatusDot({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] text-ink", className)}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: toneColor[tone], boxShadow: `0 0 0 3px color-mix(in srgb, ${toneColor[tone]} 18%, transparent)` }} />
      {children}
    </span>
  );
}

/** Badge mit Ton; für Farben aus Daten: color="#hex". */
export function Badge({ tone = "neutral", color, children, className }: { tone?: Tone; color?: string; children: ReactNode; className?: string }) {
  const c = color ?? toneColor[tone];
  return (
    <span
      className={cn("inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2 text-[12px] font-medium", className)}
      style={{ color: `color-mix(in srgb, ${c} 80%, var(--ink))`, background: `color-mix(in srgb, ${c} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 28%, transparent)` }}
    >
      {children}
    </span>
  );
}

export function Initials({ name, color, size = 28, className }: { name: string; color?: string; size?: number; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const c = color ?? "var(--subtle)";
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, color: `color-mix(in srgb, ${c} 85%, var(--ink))`, background: `color-mix(in srgb, ${c} 20%, var(--elevated))`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${c} 35%, transparent)` }}
    >
      {letters || "?"}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-active px-1.5 font-mono text-[11px] font-medium text-subtle shadow-[inset_0_-1px_0_var(--line-strong)]", className)}>{children}</kbd>;
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ui-skeleton rounded-md", className)} {...props} />;
}

export function EmptyState({ icon, title, text, action, className }: { icon?: ReactNode; title: ReactNode; text?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-elevated text-subtle shadow-[inset_0_0_0_1px_var(--line)] [&_svg]:size-5">{icon ?? <Inbox />}</div>
      <div className="text-[15px] font-semibold text-ink">{title}</div>
      {text ? <p className="mt-1 max-w-sm text-[13.5px] leading-relaxed text-subtle">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12.5px] text-muted", className)}>{children}</span>;
}
