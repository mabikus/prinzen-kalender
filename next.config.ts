import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kennung dieses Builds: die App vergleicht sie mit /api/version und meldet neue Versionen
  env: {
    APP_VERSION: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? `lokal-${Date.now()}`,
  },
  cacheComponents: true,
  experimental: {
    // Logo-Upload in der Verwaltung (zwei PNG-Größen)
    serverActions: { bodySizeLimit: "5mb" },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Nicht in Suchmaschinen aufnehmen – für jede Antwort (Seiten, Bilder, Kalender-Dateien …)
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Service Worker nie zwischenspeichern, damit Updates sofort ankommen
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
