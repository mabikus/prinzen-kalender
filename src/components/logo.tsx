import Image from "next/image";
import { cn } from "@/components/ui/cn";

/** Vereinslogo (Jubiläums-Session 2026/27) im weißen Kreis – Kopfzeilen von Ansicht, Anmeldung, Verwaltung */
export function Logo({ groesse = 44, className }: { groesse?: number; className?: string }) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06)]", className)}
      style={{ width: groesse, height: groesse }}
    >
      <Image src="/logo-klein.png" alt="" width={groesse - 4} height={groesse - 4} priority />
    </span>
  );
}
