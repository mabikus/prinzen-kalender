import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { datenquelle } from "@/lib/termine";
import { zugangsToken } from "@/lib/zugang";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Prinzen-Kalender", template: "%s · Prinzen-Kalender" },
  description: "Termine, Treffpunkte und Besetzung der Session 2026/27",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Prinzen-Kalender", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#b91c1c",
};

const NAV = [
  { href: "/", label: "Termine" },
  { href: "/monat", label: "Monat" },
  { href: "/abo", label: "Abo" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const demo = datenquelle() === "startdaten";
  const offen = !zugangsToken();
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-bold">
              <span aria-hidden className="text-xl">👑</span>
              <span>
                Prinzen-Kalender{" "}
                <span className="hidden font-normal text-zinc-500 sm:inline">26/27</span>
              </span>
            </Link>
            <nav className="flex gap-0.5 text-sm">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-lg px-2 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl space-y-1 px-4 pb-10 text-xs text-zinc-500">
          {demo && <p>Datenquelle: Startdaten im Repo (Supabase noch nicht verbunden).</p>}
          {offen && <p>⚠️ Zugriffsschutz nicht aktiv – ZUGANG_TOKEN ist nicht gesetzt.</p>}
        </footer>
      </body>
    </html>
  );
}
