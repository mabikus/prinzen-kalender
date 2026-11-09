export const metadata = { title: "Kein Zugang" };

export default function KeinZugang() {
  return (
    <div className="space-y-3 py-16 text-center">
      <p className="text-5xl">🔒</p>
      <h1 className="text-2xl font-bold">Kein Zugang</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Bitte den persönlichen Link verwenden, den du in der Gruppe bekommen hast.
      </p>
    </div>
  );
}
