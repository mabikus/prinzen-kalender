import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
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
  return (
    <html lang="de" className={`${geist.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
