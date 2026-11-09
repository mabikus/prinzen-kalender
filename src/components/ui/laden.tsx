import { cn } from "./cn";

/**
 * Ruhige Ladeanzeige: drei Punkte, die langsam pulsieren – kein Drehen, kein Flackern.
 * Erscheint erst nach einer Viertelsekunde (kurze Aktionen zeigen gar nichts).
 */
export function Punkte({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("ui-laden inline-flex items-center gap-[3px]", className)}>
      <span className="ui-punkt" />
      <span className="ui-punkt" />
      <span className="ui-punkt" />
    </span>
  );
}

/** Ruhiger Platzhalter für Seiten, die noch laden – statt „Lade …“-Text */
export function SeitenPlatzhalter() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <div className="h-7 w-48 rounded-md bg-active" />
      <div className="h-4 w-72 max-w-full rounded-md bg-hover" />
      <div className="h-40 rounded-[var(--radius-card)] bg-hover" />
      <div className="h-24 rounded-[var(--radius-card)] bg-hover" />
    </div>
  );
}
