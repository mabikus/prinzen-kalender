import type { MetadataRoute } from "next";
import { APP_BESCHREIBUNG, APP_NAME, FARBE_PAPIER, FARBE_ROT } from "@/lib/marke";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: "Session",
    description: APP_BESCHREIBUNG,
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: FARBE_PAPIER,
    theme_color: FARBE_ROT,
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Termine", url: "/" },
      { name: "Monat", url: "/monat" },
      { name: "Verwaltung", url: "/verwaltung/kalender" },
    ],
  };
}
