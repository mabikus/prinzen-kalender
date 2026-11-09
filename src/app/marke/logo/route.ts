import type { NextRequest } from "next/server";
import { ladeLogo } from "@/lib/marke-laden";

/** Logo als PNG (?klein=1 für 144 px). Mit ?v= (Logo-Stand) dauerhaft zwischenspeicherbar. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const bild = await ladeLogo(q.get("klein") === "1");
  return new Response(bild.slice().buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": q.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=300",
    },
  });
}
