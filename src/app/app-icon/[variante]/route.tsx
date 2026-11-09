import { appIcon } from "@/lib/app-icon";

const VARIANTEN: Record<string, { groesse: number; rand: number }> = {
  "192": { groesse: 192, rand: 0.16 },
  "512": { groesse: 512, rand: 0.16 },
  "maskable-512": { groesse: 512, rand: 0.24 },
};

export function generateStaticParams() {
  return Object.keys(VARIANTEN).map((variante) => ({ variante }));
}

export async function GET(_: Request, ctx: RouteContext<"/app-icon/[variante]">) {
  const v = VARIANTEN[(await ctx.params).variante];
  if (!v) return new Response("Nicht gefunden", { status: 404 });
  return appIcon(v.groesse, v.rand);
}
