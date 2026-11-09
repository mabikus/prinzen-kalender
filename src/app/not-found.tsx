import Link from "next/link";

export default function NichtGefunden() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="font-serif lining-nums text-3xl font-semibold">Nicht gefunden</h1>
      <p>
        <Link href="/" className="text-marke-700 underline underline-offset-2">
          Zur Terminübersicht
        </Link>
      </p>
    </div>
  );
}
