import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Tabelle für die Verwaltung am PC (ab xl, 1280 px). Am Handy zeigen die Seiten stattdessen ihre Listen –
 * daher standardmäßig erst ab md sichtbar (`immer` zeigt sie überall).
 */
export function Tabelle({ children, className, immer }: { children: ReactNode; className?: string; immer?: boolean }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--radius-card)] bg-panel shadow-[inset_0_0_0_1px_var(--line)]",
        immer ? "block" : "hidden xl:block",
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-[13.5px]">{children}</table>
    </div>
  );
}

/** Spaltenkopf */
export function Th({ children, className, rechts }: { children?: ReactNode; className?: string; rechts?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-bg/60 px-3 py-2.5 text-[11.5px] xl:px-4 font-semibold uppercase tracking-[0.06em] text-subtle",
        rechts && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}

/** Zelle */
export function Td({ children, className, rechts, title }: { children?: ReactNode; className?: string; rechts?: boolean; title?: string }) {
  return (
    <td title={title} className={cn("border-b border-line px-3 py-2.5 align-middle xl:px-4", rechts && "text-right tabular", className)}>
      {children}
    </td>
  );
}

/** Zeile – optional ganz anklickbar (öffnet z. B. das Bearbeiten) */
export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={
        onClick
          ? (e) => {
              // Klicks auf Knöpfe/Links/Menüs in der Zeile nicht doppelt auswerten
              if ((e.target as HTMLElement).closest("button, a, [role=menuitem]")) return;
              onClick();
            }
          : undefined
      }
      className={cn("transition-colors last:[&>td]:border-b-0", onClick && "cursor-pointer hover:bg-hover", className)}
    >
      {children}
    </tr>
  );
}

/** Zwischenüberschrift über die ganze Breite (z. B. Monat) */
export function TrAbschnitt({ spalten, children }: { spalten: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={spalten} className="border-b border-line bg-bg/40 px-3 pb-1.5 pt-4 xl:px-4">
        {children}
      </td>
    </tr>
  );
}
