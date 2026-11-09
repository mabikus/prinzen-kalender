import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { DienstHelfer } from "@/components/pwa";
import { Toaster } from "@/components/ui/toast";
import { APP_BESCHREIBUNG, APP_NAME, FARBE_ROT } from "@/lib/marke";
import "./globals.css";

// Schriften: Source Sans 3 (Text) und Source Serif 4 (Überschriften, Uhrzeiten) – klassisch und gut lesbar
const sans = Source_Sans_3({ variable: "--font-text", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const serif = Source_Serif_4({ variable: "--font-titel", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_BESCHREIBUNG,
  applicationName: APP_NAME,
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: FARBE_ROT,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <Toaster />
        <DienstHelfer />
      </body>
    </html>
  );
}
