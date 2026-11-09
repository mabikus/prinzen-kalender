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
