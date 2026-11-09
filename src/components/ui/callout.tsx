import { AlertTriangle, CircleAlert, Info, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";

const tones = {
  info: { color: "var(--info)", icon: <Info /> },
  tip: { color: "var(--info)", icon: <Lightbulb /> },
  warning: { color: "var(--warning)", icon: <AlertTriangle /> },
  danger: { color: "var(--danger)", icon: <CircleAlert /> },
  neutral: { color: "var(--subtle)", icon: <Info /> },
} as const;

/** Hinweisbox (Info, Tipp, Warnung) – für erklärende Texte in Einstellungen und Assistenten. */
export function Callout({
  tone = "info",
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "note"}
      className={cn("flex gap-3 rounded-[12px] px-4 py-3 text-[13.5px] leading-relaxed", className)}
      style={{
        background: `color-mix(in srgb, ${t.color} 9%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${t.color} 24%, transparent)`,
      }}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-4" style={{ color: t.color }}>
        {icon ?? t.icon}
      </span>
      {/* Aktion neben dem Text, wenn Platz ist – sonst (Handy, schmale Panels) darunter statt den Text zu quetschen */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="min-w-[min(100%,15rem)] flex-1 text-muted">
          {title ? <div className="font-semibold text-ink">{title}</div> : null}
          {children ? <div className={cn(title && "mt-0.5")}>{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
