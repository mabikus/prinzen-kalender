import { toNextJsHandler } from "better-auth/next-js";
import { hatDatenbank } from "@/db";
import { auth } from "@/lib/auth";

// Better-Auth-Endpunkte (/api/auth/*). Ohne Datenbank gibt es keine Anmeldung.
function handler() {
  return toNextJsHandler(auth());
}

const ohneDb = () => Response.json({ message: "Anmeldung nicht verfügbar – keine Datenbank." }, { status: 503 });

export async function GET(request: Request) {
  return hatDatenbank() ? handler().GET(request) : ohneDb();
}

export async function POST(request: Request) {
  return hatDatenbank() ? handler().POST(request) : ohneDb();
}
