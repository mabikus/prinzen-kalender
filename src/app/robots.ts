import type { MetadataRoute } from "next";

/**
 * Nichts davon gehört in eine Suchmaschine.
 * - Google und Bing dürfen abrufen, damit sie das „noindex“ (Meta-Tag + X-Robots-Tag) überhaupt sehen –
 *   eine reine robots.txt-Sperre ließe die Adresse bei Verlinkung trotzdem ohne Inhalt in den Ergebnissen auftauchen.
 * - Alle anderen (auch KI-Crawler) sind komplett ausgesperrt.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/" },
      { userAgent: "*", disallow: "/" },
    ],
  };
}
