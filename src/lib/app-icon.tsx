import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { FARBE_ROT } from "./marke";

/**
 * App-Symbol (Home-Bildschirm, Installation, Apple-Icon).
 * Liegt ein Logo unter public/logo.png, wird es verwendet – sonst die Krone.
 * `rand`: Anteil Innenabstand (maskierbare Icons brauchen ca. 20 % Schutzzone).
 */
export async function appIcon(groesse: number, rand = 0.16) {
  let logo: string | null = null;
  try {
    const datei = await readFile(path.join(process.cwd(), "public", "logo.png"));
    logo = `data:image/png;base64,${datei.toString("base64")}`;
  } catch {
    // kein Logo – Krone
  }
  const innen = Math.round(groesse * (1 - 2 * rand));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: logo ? "#ffffff" : FARBE_ROT,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={innen} height={innen} style={{ objectFit: "contain" }} alt="" />
        ) : (
          <svg width={innen} height={innen} viewBox="0 0 64 64">
            <path d="M12 46 L10 20 L23 31 L32 14 L41 31 L54 20 L52 46 Z" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M12 52 H52" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
    ),
    { width: groesse, height: groesse },
  );
}
