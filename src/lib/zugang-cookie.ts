import "server-only";
import { cookies } from "next/headers";
import { COOKIE, zugangsToken } from "./zugang";

/** Administratoren sehen nach der Anmeldung auch die Ansicht – ohne extra Zugangslink. */
export async function setzeZugangCookie() {
  const token = zugangsToken();
  if (!token) return;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
}
