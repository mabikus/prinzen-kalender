import Link from "next/link";
import { Crown } from "lucide-react";
import { APP_KURZ, APP_NAME } from "@/lib/marke";

/** Rahmen der Anmeldeseiten: Karte in der Mitte, rote Kopfzeile. */
export default function AnmeldungLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[var(--radius-dialog)] border border-line bg-panel shadow-[0_1px_3px_rgba(31,26,23,0.06)]">
        <div className="flex items-center gap-3 border-b-[3px] border-kopf-rand bg-kopf px-6 py-4 text-white">
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-accent">
            <Crown className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <div className="font-display text-lg font-semibold leading-tight">{APP_NAME}</div>
            <div className="text-xs text-white/75">{APP_KURZ}</div>
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
