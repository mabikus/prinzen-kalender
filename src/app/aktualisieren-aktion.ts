"use server";

import { updateTag } from "next/cache";
import { DATEN_TAG } from "@/lib/daten";

/** „Aktualisieren“ in der App: Termine frisch aus der Datenbank holen (Zwischenspeicher erneuern). */
export async function datenFrischHolen() {
  updateTag(DATEN_TAG);
}
