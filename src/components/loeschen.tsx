"use client";

export function LoeschenKnopf({ frage, children = "Löschen" }: { frage: string; children?: React.ReactNode }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(frage)) e.preventDefault();
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-marke-700 ring-1 ring-inset ring-marke-200 transition hover:bg-marke-50"
    >
      {children}
    </button>
  );
}
