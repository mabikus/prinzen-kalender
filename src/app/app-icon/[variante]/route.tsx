import type { NextRequest } from "next/server";
import { appIcon } from "@/lib/app-icon";
import { ladeLogo } from "@/lib/marke-laden";

const VARIANTEN: Record<string, { groesse: number; rand: number }> = {
  "192": { groesse: 192, rand: 0.16 },
  "512": { groesse: 512, rand: 0.16 },
  "maskable-512": { groesse: 512, rand: 0.24 },
  apple: { groesse: 180, rand: 0.14 }, // „Zum Home-Bildschirm“ auf dem iPhone
  favicon: { groesse: 64, rand: 0.04 }, // Browser-Tab
};

export async function GET(req: NextRequest, ctx: RouteContext<"/app-icon/[variante]">) {
  const v = VARIANTEN[(await ctx.params).variante];
  if (!v) return new Response("Nicht gefunden", { status: 404 });
  return appIcon(await ladeLogo(), v.groesse, v.rand, req.nextUrl.searchParams.has("v"));
}
