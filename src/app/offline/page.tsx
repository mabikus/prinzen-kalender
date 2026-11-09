import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

/** Wird vom Service Worker gezeigt, wenn keine Verbindung besteht und die Seite nicht gespeichert ist. */
export default function Offline() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-marke-50 text-marke-700">
        <WifiOff className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="font-serif text-2xl font-semibold">Keine Verbindung</h1>
      <p className="text-grau">
        Diese Seite ist noch nicht auf dem Gerät gespeichert. Bereits geöffnete Seiten funktionieren auch
        offline.
      </p>
      <Link href="/" className="rounded-md bg-marke-700 px-4 py-2.5 font-semibold text-white">
        Zur Terminübersicht
      </Link>
    </div>
  );
}
