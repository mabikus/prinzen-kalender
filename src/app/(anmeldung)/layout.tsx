import Link from "next/link";
import { Logo } from "@/components/logo";
import { ladeMarke } from "@/lib/marke-laden";

/** Rahmen der Anmeldeseiten: Karte in der Mitte, rote Kopfzeile. */
export default async function AnmeldungLayout({ children }: { children: React.ReactNode }) {
  const marke = await ladeMarke();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[var(--radius-dialog)] border border-line bg-panel shadow-[0_1px_3px_rgba(31,26,23,0.06)]">
        <div className="flex items-center gap-3 border-b-[3px] border-kopf-rand bg-kopf px-6 py-4 text-white">
          <Logo groesse={44} stand={marke.logoStand} />
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{marke.name}</div>
            <div className="text-xs text-white/75">{marke.untertitel}</div>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <Link href="/" className="mt-6 text-sm text-subtle hover:text-accent-ink">
        Zur Terminübersicht
      </Link>
    </div>
  );
}
