import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { Crown, TriangleAlert } from "lucide-react";
import { NavLinks, Navigation } from "@/components/navigation";
import { datenquelle } from "@/lib/daten";
import { zugangsToken } from "@/lib/zugang";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: "Prinzen-Kalender", template: "%s · Prinzen-Kalender" },
  description: "Termine, Treffpunkte und Gruppen der Session 2026/27",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Prinzen-Kalender", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#9a1219",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const quelle = datenquelle();
  const offen = !zugangsToken();
  return (
    <html lang="de" className={`${geist.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <header className="sticky top-0 z-20 border-b-[3px] border-marke-800 bg-marke-700 text-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4">
            <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="flex size-8 items-center justify-center rounded-full bg-white text-marke-700">
                <Crown className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="font-serif lining-nums text-lg font-semibold tracking-wide">
                <span className="hidden min-[400px]:inline">Prinzen-</span>Kalender
                <span className="ml-1.5 hidden font-sans text-sm font-normal text-white/70 sm:inline">
                  Session 26/27
                </span>
              </span>
            </Link>
            <Suspense fallback={<NavLinks pfad={null} />}>
              <Navigation />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl space-y-1 px-4 pb-10 text-xs text-grau">
          {quelle === "startdaten" && <p>Datenquelle: Startdaten im Repo (Supabase noch nicht verbunden).</p>}
          {quelle === "datei" && <p>Datenquelle: lokale Datei .daten/daten.json (Entwicklung).</p>}
          {offen && (
            <p className="flex items-center gap-1.5">
              <TriangleAlert className="size-3.5" strokeWidth={1.75} aria-hidden />
              Zugriffsschutz nicht aktiv – ZUGANG_TOKEN ist nicht gesetzt.
            </p>
          )}
        </footer>
      </body>
    </html>
  );
}
