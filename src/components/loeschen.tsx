"use client";

export function LoeschenKnopf({ frage, children = "Löschen" }: { frage: string; children?: React.ReactNode }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(frage)) e.preventDefault();
      }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-300 hover:bg-red-50 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-950"
    >
      {children}
    </button>
  );
}
