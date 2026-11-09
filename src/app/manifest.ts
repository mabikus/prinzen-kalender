import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prinzen-Kalender 26/27",
    short_name: "Prinzen-Kalender",
    description: "Termine, Treffpunkte und Besetzung der Session 2026/27",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#b91c1c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
