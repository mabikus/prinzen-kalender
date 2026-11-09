import { Lock } from "lucide-react";

export const metadata = { title: "Kein Zugang" };

export default function KeinZugang() {
  return (
    <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-marke-50 text-marke-700">
        <Lock className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h1 className="font-serif lining-nums text-3xl font-semibold">Kein Zugang</h1>
      <p className="text-grau">Bitte den persönlichen Link verwenden, den du in der Gruppe bekommen hast.</p>
    </div>
  );
}
