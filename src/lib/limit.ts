import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Einfache Begrenzung von Versuchen (z. B. Anmeldung) über die Tabelle rate_limit.
 * Gibt false zurück, wenn im Zeitfenster schon `max` Versuche gezählt wurden.
 */
export async function versuchErlaubt(key: string, max: number, fensterMs: number): Promise<boolean> {
  const jetzt = Date.now();
  const { rows } = await db().execute<{ count: number }>(sql`
    insert into rate_limit (id, key, count, last_request)
    values (${crypto.randomUUID()}, ${key}, 1, ${jetzt})
    on conflict (key) do update set
      count = case when rate_limit.last_request < ${jetzt - fensterMs} then 1 else rate_limit.count + 1 end,
      last_request = case when rate_limit.last_request < ${jetzt - fensterMs} then ${jetzt} else rate_limit.last_request end
    returning count
  `);
  return Number(rows[0]?.count ?? 0) <= max;
}
