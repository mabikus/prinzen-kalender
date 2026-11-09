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
