import { cn } from "@/components/ui/cn";

/** Vereinslogo im weißen Kreis – Kopfzeilen von Ansicht, Anmeldung, Verwaltung. `stand` = Logo-Version (?v=) */
export function Logo({ groesse = 44, stand, className }: { groesse?: number; stand: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]", className)}
      style={{ width: groesse, height: groesse }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamisches Logo aus der Verwaltung */}
      <img src={`/marke/logo?klein=1&v=${stand}`} alt="" width={groesse - 4} height={groesse - 4} decoding="async" />
    </span>
  );
}
