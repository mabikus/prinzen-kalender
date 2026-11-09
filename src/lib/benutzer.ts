import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, desc, eq, gt, isNull, max, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "./auth";
import { protokolliereAktion, type Wer } from "./daten";

// Benutzerverwaltung: nur Administratoren, genau ein Super-Admin (nicht löschbar, Datenbank schützt ihn zusätzlich).
// Neue Administratoren kommen über einen Einladungslink, vergessene Passwörter über einen Passwort-Link –
// beides erstellt ein Administrator und gibt den Link weiter (kein E-Mail-Versand nötig).

export const EINLADUNG_TAGE = 7;
export const PASSWORT_LINK_STUNDEN = 48;

export class BenutzerFehler extends Error {}

export function normalisiereEmail(e: string) {
  return e.trim().toLowerCase();
}

export async function anzahlBenutzer(): Promise<number> {
  const [r] = await db().select({ n: count() }).from(schema.user);
  return Number(r?.n ?? 0);
}

export interface BenutzerZeile {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  banned: boolean;
  createdAt: string;
  passkeys: number;
  zuletztAktiv: string | null;
}

export async function ladeBenutzer(): Promise<BenutzerZeile[]> {
  const d = db();
  const [nutzer, pk, sitzungen] = await Promise.all([
    d.select().from(schema.user).orderBy(desc(sql`${schema.user.role} = 'superadmin'`), schema.user.name),
    d.select({ userId: schema.passkey.userId, n: count() }).from(schema.passkey).groupBy(schema.passkey.userId),
    d.select({ userId: schema.session.userId, zuletzt: max(schema.session.updatedAt) }).from(schema.session).groupBy(schema.session.userId),
  ]);
  return nutzer.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
    passkeys: Number(pk.find((p) => p.userId === u.id)?.n ?? 0),
    zuletztAktiv: sitzungen.find((s) => s.userId === u.id)?.zuletzt?.toISOString() ?? null,
  }));
}

/** Legt ein Konto mit Passwort an (Better Auth hasht das Passwort). */
export async function erstelleBenutzer(opts: { name: string; email: string; passwort: string; role: "superadmin" | "admin" }) {
  const ctx = await auth().$context;
  const email = normalisiereEmail(opts.email);
  if (await ctx.internalAdapter.findUserByEmail(email)) throw new BenutzerFehler("Diese E-Mail-Adresse ist schon vergeben.");
  pruefePasswort(opts.passwort);
  const hash = await ctx.password.hash(opts.passwort);
  const u = await ctx.internalAdapter.createUser(
    { name: opts.name.trim(), email, emailVerified: true, role: opts.role },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({ userId: u.id, providerId: "credential", accountId: u.id, password: hash });
  return u;
}

export function pruefePasswort(p: string) {
  if (p.length < 10) throw new BenutzerFehler("Das Passwort muss mindestens 10 Zeichen haben.");
  if (p.length > 128) throw new BenutzerFehler("Das Passwort ist zu lang.");
}

const neuesToken = () => randomBytes(24).toString("hex");

export async function einladungErstellen(opts: { email: string; name: string | null }, wer: Wer) {
  const email = normalisiereEmail(opts.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BenutzerFehler("Bitte eine gültige E-Mail-Adresse angeben.");
  const ctx = await auth().$context;
  if (await ctx.internalAdapter.findUserByEmail(email)) throw new BenutzerFehler("Für diese E-Mail-Adresse gibt es schon ein Konto.");
  const id = neuesToken();
  await db()
    .insert(schema.einladungen)
    .values({
      id,
      zweck: "einladung",
      email,
      name: opts.name?.trim() || null,
      erstellt_von: wer.id,
      laeuft_ab: new Date(Date.now() + EINLADUNG_TAGE * 86_400_000),
    });
  await protokolliereAktion(wer, "benutzer.eingeladen", { id: email, titel: opts.name?.trim() || email });
  return id;
}

export async function passwortLinkErstellen(benutzerId: string, wer: Wer & { role: "superadmin" | "admin" }) {
  const [u] = await db().select().from(schema.user).where(eq(schema.user.id, benutzerId));
  if (!u) throw new BenutzerFehler("Benutzer nicht gefunden.");
  if (u.role === "superadmin" && wer.role !== "superadmin")
    throw new BenutzerFehler("Nur der Super-Admin selbst kann für sich einen Passwort-Link erstellen.");
  const id = neuesToken();
  await db()
    .insert(schema.einladungen)
    .values({
      id,
      zweck: "passwort",
      email: u.email,
      name: u.name,
      benutzer_id: u.id,
      erstellt_von: wer.id,
      laeuft_ab: new Date(Date.now() + PASSWORT_LINK_STUNDEN * 3_600_000),
    });
  await protokolliereAktion(wer, "benutzer.passwort_link", { id: u.id, titel: u.name });
  return id;
}

export type Einladung = typeof schema.einladungen.$inferSelect;

/** Gültige (nicht abgelaufene, nicht eingelöste) Einladung oder null. */
export async function ladeEinladung(token: string): Promise<Einladung | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const [e] = await db()
    .select()
    .from(schema.einladungen)
    .where(
      and(
        eq(schema.einladungen.id, token),
        isNull(schema.einladungen.eingeloest_am),
        gt(schema.einladungen.laeuft_ab, new Date()),
      ),
    );
  return e ?? null;
}

/** Einladung annehmen (Konto anlegen) oder Passwort-Link einlösen (Passwort setzen). Gibt die E-Mail zurück. */
export async function einladungEinloesen(token: string, opts: { name: string; passwort: string }): Promise<string> {
  const e = await ladeEinladung(token);
  if (!e) throw new BenutzerFehler("Dieser Link ist ungültig oder abgelaufen.");
  pruefePasswort(opts.passwort);
  // Zuerst einlösen (atomar), damit ein Link nicht doppelt genutzt werden kann
  const eingeloest = await db()
    .update(schema.einladungen)
    .set({ eingeloest_am: new Date() })
    .where(and(eq(schema.einladungen.id, token), isNull(schema.einladungen.eingeloest_am)))
    .returning({ id: schema.einladungen.id });
  if (!eingeloest.length) throw new BenutzerFehler("Dieser Link wurde bereits verwendet.");

  if (e.zweck === "einladung") {
    const u = await erstelleBenutzer({ name: opts.name || e.name || e.email, email: e.email, passwort: opts.passwort, role: "admin" });
    await protokolliereAktion({ id: u.id, name: u.name }, "benutzer.beigetreten", { id: u.id, titel: u.name });
  } else {
    const ctx = await auth().$context;
    const hash = await ctx.password.hash(opts.passwort);
    const konten = await ctx.internalAdapter.findAccounts(e.benutzer_id!);
    if (konten.some((k) => k.providerId === "credential")) await ctx.internalAdapter.updatePassword(e.benutzer_id!, hash);
    else await ctx.internalAdapter.linkAccount({ userId: e.benutzer_id!, providerId: "credential", accountId: e.benutzer_id!, password: hash });
    await ctx.internalAdapter.deleteUserSessions(e.benutzer_id!);
    await protokolliereAktion({ id: e.benutzer_id!, name: e.name ?? e.email }, "benutzer.passwort_neu", {
      id: e.benutzer_id!,
      titel: e.name ?? e.email,
    });
  }
  return e.email;
}

export async function offeneEinladungen() {
  return db()
    .select()
    .from(schema.einladungen)
    .where(
      and(
        eq(schema.einladungen.zweck, "einladung"),
        isNull(schema.einladungen.eingeloest_am),
        gt(schema.einladungen.laeuft_ab, new Date()),
      ),
    )
    .orderBy(desc(schema.einladungen.erstellt_am));
}

export async function einladungZurueckziehen(token: string, wer: Wer) {
  const [e] = await db().delete(schema.einladungen).where(eq(schema.einladungen.id, token)).returning();
  if (e) await protokolliereAktion(wer, "benutzer.einladung_zurueckgezogen", { id: e.email, titel: e.name ?? e.email });
}

async function zielBenutzer(id: string, wer: Wer) {
  const [u] = await db().select().from(schema.user).where(eq(schema.user.id, id));
  if (!u) throw new BenutzerFehler("Benutzer nicht gefunden.");
  if (u.role === "superadmin") throw new BenutzerFehler("Der Super-Admin kann nicht deaktiviert oder gelöscht werden.");
  if (u.id === wer.id) throw new BenutzerFehler("Das eigene Konto kann hier nicht deaktiviert oder gelöscht werden.");
  return u;
}

export async function setzeAktiv(id: string, aktiv: boolean, wer: Wer) {
  const u = await zielBenutzer(id, wer);
  await db().update(schema.user).set({ banned: !aktiv }).where(eq(schema.user.id, id));
  if (!aktiv) await (await auth().$context).internalAdapter.deleteUserSessions(id);
  await protokolliereAktion(wer, aktiv ? "benutzer.aktiviert" : "benutzer.deaktiviert", { id, titel: u.name });
}

export async function loescheBenutzer(id: string, wer: Wer) {
  const u = await zielBenutzer(id, wer);
  await db().delete(schema.user).where(eq(schema.user.id, id));
  await protokolliereAktion(wer, "benutzer.geloescht", { id, titel: u.name }, { email: u.email });
}

export async function aendereName(id: string, name: string) {
  const n = name.trim();
  if (!n) throw new BenutzerFehler("Bitte einen Namen angeben.");
  await db().update(schema.user).set({ name: n }).where(eq(schema.user.id, id));
}
