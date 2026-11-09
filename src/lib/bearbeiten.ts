import "server-only";
import { cookies } from "next/headers";

// Bearbeiten-Recht. Ist BEARBEITEN_TOKEN gesetzt, muss man sich unter
// /verwaltung einmal mit diesem Passwort anmelden. Ohne BEARBEITEN_TOKEN darf
// jeder bearbeiten, der Zugang zur Seite hat.

export const BEARBEITEN_COOKIE = "pk_bearbeiten";

export function bearbeitenToken(): string | null {
  return process.env.BEARBEITEN_TOKEN?.trim() || null;
}

export async function darfBearbeiten(): Promise<boolean> {
  const token = bearbeitenToken();
  if (!token) return true;
  return (await cookies()).get(BEARBEITEN_COOKIE)?.value === token;
}
