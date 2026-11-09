import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hatDatenbank } from "@/db";
import { auth } from "./auth";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  sessionId: string;
}

/** Angemeldeter Administrator oder null. Liest bei jedem Aufruf aus der Datenbank (kein Cache). */
export async function aktuellerAdmin(): Promise<Admin | null> {
  if (!hatDatenbank()) return null;
  const s = await auth().api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: string; banned?: boolean };
  if (u.banned) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "superadmin" ? "superadmin" : "admin",
    sessionId: s.session.id,
  };
}

/** Für Seiten und Aktionen der Verwaltung: ohne Anmeldung zur Anmeldeseite. */
export async function brauchtAdmin(): Promise<Admin> {
  const a = await aktuellerAdmin();
  if (!a) redirect("/anmelden");
  return a;
}
