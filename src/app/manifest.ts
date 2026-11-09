import type { MetadataRoute } from "next";
import { FARBE_PAPIER, FARBE_ROT } from "@/lib/marke";
import { beschreibung, ladeMarke } from "@/lib/marke-laden";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const m = await ladeMarke();
  const v = `?v=${m.logoStand}`;
  return {
    id: "/",
    name: m.name,
    short_name: m.name,
    description: beschreibung(m),
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: FARBE_PAPIER,
    theme_color: FARBE_ROT,
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: `/app-icon/192${v}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/app-icon/512${v}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/app-icon/maskable-512${v}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Termine", url: "/" },
      { name: "Monat", url: "/monat" },
      { name: "Verwaltung", url: "/verwaltung/kalender" },
    ],
  };
}
