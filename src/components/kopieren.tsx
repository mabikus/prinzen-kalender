"use client";

import { useState } from "react";

export function Kopieren({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          window.prompt("Link kopieren:", text);
        }
      }}
      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-300 hover:bg-zinc-100 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:bg-zinc-800"
    >
      {ok ? "✓ Kopiert" : "📋 Link kopieren"}
    </button>
  );
}
