import Link from "next/link";

export default function NichtGefunden() {
  return (
    <div className="mx-auto max-w-sm space-y-3 px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-marke-700">404</p>
      <h1 className="font-serif lining-nums text-3xl font-semibold">Nicht gefunden</h1>
      <p>
        <Link href="/" className="text-marke-700 underline underline-offset-2">
          Zur Terminübersicht
        </Link>
      </p>
    </div>
  );
}
