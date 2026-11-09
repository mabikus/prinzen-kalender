import Link from "next/link";

export default function NichtGefunden() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="text-2xl font-bold">Nicht gefunden</h1>
      <p>
        <Link href="/" className="text-red-700 underline dark:text-red-400">
          Zur Terminübersicht
        </Link>
      </p>
    </div>
  );
}
