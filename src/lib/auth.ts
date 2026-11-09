import "server-only";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { APP_NAME } from "./marke";

// Anmeldung (Better Auth): E-Mail + Passwort und Passkeys. Keine Selbst-Registrierung –
// Administratoren werden eingeladen (src/lib/benutzer.ts). Der Super-Admin entsteht bei der Einrichtung.

export const COOKIE_PREFIX = "pk";

/** Öffentliche Adresse der App – für Cookies, Passkeys und Links. */
export function basisUrl(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function vertrauteHerkuenfte(): string[] {
  const liste = [basisUrl()];
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL])
    if (v) liste.push(`https://${v}`);
  return [...new Set(liste)];
}

function erstelleAuth() {
  return betterAuth({
    appName: APP_NAME,
    baseURL: basisUrl(),
    trustedOrigins: vertrauteHerkuenfte(),
    // Eigenes Geheimnis bevorzugt; sonst das der Supabase-Integration (zufällig, geheim, nur auf dem Server)
    secret: process.env.BETTER_AUTH_SECRET || process.env.SUPABASE_JWT_SECRET,
    database: drizzleAdapter(db(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "admin", input: false },
        banned: { type: "boolean", required: false, defaultValue: false, input: false },
      },
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 Tage
      updateAge: 60 * 60 * 24, // täglich verlängern
      // Kein Cookie-Cache: Deaktivieren/Löschen wirkt sofort
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/passkey/*": { window: 60, max: 20 },
        "/change-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      database: { generateId: () => crypto.randomUUID() },
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },
    databaseHooks: {
      session: {
        create: {
          // Deaktivierte Konten bekommen keine Sitzung – egal ob Passwort oder Passkey
          before: async (s) => {
            const [u] = await db().select({ banned: schema.user.banned }).from(schema.user).where(eq(schema.user.id, s.userId));
            if (!u || u.banned) throw new APIError("FORBIDDEN", { message: "Dieses Konto ist deaktiviert." });
          },
        },
      },
    },
    plugins: [passkey({ rpName: APP_NAME }), nextCookies()],
  });
}

type Auth = ReturnType<typeof erstelleAuth>;
const global = globalThis as unknown as { __pkAuth?: Auth };

/** Better-Auth-Instanz (erst beim ersten Gebrauch – ohne Datenbank gibt es keine). */
export function auth(): Auth {
  global.__pkAuth ??= erstelleAuth();
  return global.__pkAuth;
}
