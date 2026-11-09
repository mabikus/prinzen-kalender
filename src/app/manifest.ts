import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prinzen-Kalender 26/27",
    short_name: "Prinzen-Kalender",
    description: "Termine, Treffpunkte und Besetzung der Session 2026/27",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f3",
    theme_color: "#9a1219",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
