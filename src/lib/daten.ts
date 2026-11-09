import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { startGruppen, startTermine } from "@/data/session-2026-27";
import type { Daten, Gruppe, Termin } from "./types";
import { sortiere } from "./zeit";

// Datenzugriff mit drei Betriebsarten:
// - supabase:   SUPABASE_URL + SUPABASE_SECRET_KEY gesetzt (Produktion)
// - datei:      lokal ohne Supabase – Änderungen landen in .daten/daten.json
// - startdaten: auf Vercel ohne Supabase – nur lesen

export type Datenquelle = "supabase" | "datei" | "startdaten";

export function datenquelle(): Datenquelle {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) return "supabase";
  if (process.env.VERCEL) return "startdaten";
  return "datei";
}

/** Kann gespeichert werden? Sonst Grund als Text. */
export function speichernMoeglich(): true | string {
  return datenquelle() === "startdaten"
    ? "Bearbeiten ist erst möglich, wenn Supabase verbunden ist (siehe README)."
    : true;
}

function ordne(d: Daten): Daten {
  return {
    gruppen: [...d.gruppen].sort((a, b) => a.sortierung - b.sortierung || a.name.localeCompare(b.name)),
    termine: sortiere(d.termine),
  };
}

/** Alle Termine und Gruppen – bei jeder Anfrage frisch (kein Cache). */
export async function ladeDaten(): Promise<Daten> {
  await connection();
  switch (datenquelle()) {
    case "supabase":
      return ordne(await sb.laden());
    case "datei":
      return ordne(await datei.laden());
    default:
      return ordne({ termine: startTermine, gruppen: startGruppen });
  }
}

export async function speichereTermin(t: Termin) {
  if (datenquelle() === "supabase") return sb.speichereTermin(t);
  const d = await datei.laden();
  d.termine = [...d.termine.filter((x) => x.id !== t.id), t];
  await datei.schreiben(d);
}

export async function loescheTermin(id: string) {
  if (datenquelle() === "supabase") return sb.loescheTermin(id);
  const d = await datei.laden();
  d.termine = d.termine
    .filter((x) => x.id !== id)
    .map((x) => (x.anschluss_an === id ? { ...x, anschluss_an: null } : x));
  await datei.schreiben(d);
}

export async function speichereGruppe(g: Gruppe) {
  if (datenquelle() === "supabase") return sb.speichereGruppe(g);
  const d = await datei.laden();
  d.gruppen = [...d.gruppen.filter((x) => x.id !== g.id), g];
  await datei.schreiben(d);
}

export async function loescheGruppe(id: string) {
  if (datenquelle() === "supabase") return sb.loescheGruppe(id);
  const d = await datei.laden();
  d.gruppen = d.gruppen.filter((x) => x.id !== id);
  d.termine = d.termine.map((t) => ({ ...t, gruppen: t.gruppen.filter((g) => g !== id) }));
  await datei.schreiben(d);
}

// ───────────── Lokale Datei ─────────────

const datei = {
  pfad: () => process.env.DATEN_DATEI ?? path.join(process.cwd(), ".daten", "daten.json"),

  async laden(): Promise<Daten> {
    try {
      return JSON.parse(await readFile(this.pfad(), "utf8")) as Daten;
    } catch {
      return structuredClone({ termine: startTermine, gruppen: startGruppen });
    }
  },

  async schreiben(d: Daten) {
    const p = this.pfad();
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(`${p}.tmp`, JSON.stringify(d, null, 2));
    await rename(`${p}.tmp`, p);
  },
};

// ───────────── Supabase ─────────────

function client(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** "18:30:00" -> "18:30" */
function zeit(v: unknown): string | null {
  return typeof v === "string" && v.length >= 5 ? v.slice(0, 5) : null;
}

function pruefe<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(`Supabase: ${r.error.message}`);
  return r.data;
}

const sb = {
  async laden(): Promise<Daten> {
    const db = client();
    const [gruppen, termine] = await Promise.all([
      db.from("gruppen").select("*"),
      db.from("termine").select("*, termin_gruppen(gruppe_id)"),
    ]);
    return {
      gruppen: pruefe(gruppen) as Gruppe[],
      termine: (pruefe(termine) ?? []).map((r: Record<string, unknown>) => {
        const { termin_gruppen, ...rest } = r as Record<string, unknown> & {
          termin_gruppen: { gruppe_id: string }[] | null;
        };
        return {
          ...(rest as unknown as Termin),
          treffzeit: zeit(rest.treffzeit),
          beginn: zeit(rest.beginn),
          ende: zeit(rest.ende),
          quelle: (rest.quelle as string[]) ?? [],
          gruppen: (termin_gruppen ?? []).map((x) => x.gruppe_id),
        };
      }),
    };
  },

  async speichereTermin(t: Termin) {
    const db = client();
    const { gruppen, ...zeile } = t;
    pruefe(await db.from("termine").upsert(zeile));
    pruefe(await db.from("termin_gruppen").delete().eq("termin_id", t.id));
    if (gruppen.length) {
      pruefe(await db.from("termin_gruppen").insert(gruppen.map((gruppe_id) => ({ termin_id: t.id, gruppe_id }))));
    }
  },

  async loescheTermin(id: string) {
    pruefe(await client().from("termine").delete().eq("id", id));
  },

  async speichereGruppe(g: Gruppe) {
    pruefe(await client().from("gruppen").upsert(g));
  },

  async loescheGruppe(id: string) {
    pruefe(await client().from("gruppen").delete().eq("id", id));
  },
};
