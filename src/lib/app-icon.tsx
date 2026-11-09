import { ImageResponse } from "next/og";

/**
 * App-Symbol (Home-Bildschirm, Installation, Browser) aus dem Logo auf Weiß.
 * `rand`: Anteil Innenabstand (maskierbare Icons brauchen ca. 20 % Schutzzone).
 */
export function appIcon(logo: Uint8Array, groesse: number, rand = 0.16, dauerhaft = false) {
  const innen = Math.round(groesse * (1 - 2 * rand));
  const src = `data:image/png;base64,${Buffer.from(logo).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={innen} height={innen} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    {
      width: groesse,
      height: groesse,
      headers: { "Cache-Control": dauerhaft ? "public, max-age=31536000, immutable" : "public, max-age=300" },
    },
  );
}
