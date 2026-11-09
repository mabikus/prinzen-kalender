import type { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { ladeLogo } from "@/lib/marke-laden";
import { STARTBILDER } from "@/lib/startbilder";

/** Startbildschirm der Home-Bildschirm-App (iPhone): Logo mittig auf Weiß */
export async function GET(req: NextRequest, ctx: RouteContext<"/startbild/[format]">) {
  const { format } = await ctx.params;
  const s = STARTBILDER.find((x) => `${x.breite}x${x.hoehe}` === format);
  if (!s) return new Response("Nicht gefunden", { status: 404 });
  const logo = Buffer.from(await ladeLogo()).toString("base64");
  const groesse = Math.round(s.breite * 0.62);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo}`} width={groesse} height={groesse} alt="" />
      </div>
    ),
    {
      width: s.breite,
      height: s.hoehe,
      headers: { "Cache-Control": req.nextUrl.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=300" },
    },
  );
}
