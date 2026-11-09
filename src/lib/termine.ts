import "server-only";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startTermine } from "@/data/session-2026-27";
import type { Termin } from "./types";
import { sortiere } from "./zeit";

export type Datenquelle = "supabase" | "startdaten";

export function datenquelle(): Datenquelle {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
    ? "supabase"
    : "startdaten";
}

/** "18:30:00" -> "18:30" */
function zeit(v: unknown): string | null {
  return typeof v === "string" && v.length >= 5 ? v.slice(0, 5) : null;
}

function ausDb(r: Record<string, unknown>): Termin {
  return {
    ...(r as unknown as Termin),
    treffzeit: zeit(r.treffzeit),
    beginn: zeit(r.beginn),
    einlass: zeit(r.einlass),
    ende: zeit(r.ende),
    quelle: (r.quelle as Termin["quelle"]) ?? [],
  };
}

/**
 * Alle Termine, sortiert. Liest aus Supabase, wenn SUPABASE_URL und
 * SUPABASE_SECRET_KEY gesetzt sind – sonst aus den Startdaten im Repo.
 * Wird bei jeder Anfrage frisch geladen (kein Cache), damit Änderungen
 * sofort sichtbar sind.
 */
export async function ladeTermine(): Promise<Termin[]> {
  await connection();

  if (datenquelle() === "startdaten") return sortiere(startTermine);

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.from("termine").select("*");
  if (error) throw new Error(`Supabase: ${error.message}`);
  return sortiere((data ?? []).map(ausDb));
}

export async function ladeTermin(id: string): Promise<Termin | undefined> {
  return (await ladeTermine()).find((t) => t.id === id);
}
