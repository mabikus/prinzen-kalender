import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { STARTBILDER } from "@/lib/startbilder";

/** Startbildschirm der Home-Bildschirm-App (iPhone): Logo mittig auf Weiß */
export function generateStaticParams() {
  return STARTBILDER.map((s) => ({ format: `${s.breite}x${s.hoehe}` }));
}

export async function GET(_: Request, ctx: RouteContext<"/startbild/[format]">) {
  const { format } = await ctx.params;
  const s = STARTBILDER.find((x) => `${x.breite}x${x.hoehe}` === format);
  if (!s) return new Response("Nicht gefunden", { status: 404 });
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const groesse = Math.round(s.breite * 0.62);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo.toString("base64")}`} width={groesse} height={groesse} alt="" />
      </div>
    ),
    { width: s.breite, height: s.hoehe },
  );
}
