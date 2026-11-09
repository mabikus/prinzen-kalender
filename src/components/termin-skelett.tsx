/** Gerüst der Termin-Details, solange (selten) noch geladen wird – statt Ladepunkten */
export function TerminSkelett() {
  const balken = "rounded-md bg-stone-200/70";
  return (
    <div aria-hidden className="animate-pulse space-y-5">
      <div className={`h-3.5 w-28 ${balken}`} />
      <div className={`h-8 w-3/4 ${balken}`} />
      <div className={`h-4 w-1/2 ${balken}`} />
      <div className="h-[104px] rounded-[14px] border border-linie bg-panel" />
      <div className="h-[150px] rounded-[14px] border border-linie bg-panel" />
      <div className="h-[110px] rounded-[14px] border border-linie bg-panel" />
    </div>
  );
}

/** Gerüst der Terminliste (falls der Tab doch einmal laden muss) */
export function ListenSkelett() {
  return (
    <div aria-hidden className="animate-pulse space-y-4">
      <div className="h-[230px] rounded-lg border border-linie bg-panel" />
      <div className="flex gap-2">
        {[110, 70, 70, 90].map((w, i) => (
          <div key={i} className="h-10 rounded-md bg-stone-200/70" style={{ width: w }} />
        ))}
      </div>
      <div className="h-7 w-40 rounded-md bg-stone-200/70" />
      <div className="h-[120px] rounded-lg border border-linie bg-panel" />
      <div className="h-[120px] rounded-lg border border-linie bg-panel" />
    </div>
  );
}

/** Gerüst des Monats (falls der Tab doch einmal laden muss) */
export function MonatSkelett() {
  return (
    <div aria-hidden className="animate-pulse space-y-3">
      <div className="h-7 w-44 rounded-md bg-stone-200/70" />
      <div className="h-[270px] rounded-lg bg-stone-200/40" />
      <div className="h-[100px] rounded-[14px] border border-linie bg-panel" />
    </div>
  );
}
