import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { FARBSCHEMA_SKRIPT } from "@/lib/farbschema";
import { DienstHelfer, UpdateHinweis } from "@/components/pwa";
import { Toaster } from "@/components/ui/toast";
import { FARBE_ROT } from "@/lib/marke";
import { basisUrl } from "@/lib/auth";
import { beschreibung, ladeMarke } from "@/lib/marke-laden";
import { STARTBILDER } from "@/lib/startbilder";
import "./globals.css";

// Schriften: Source Sans 3 (Text) und Source Serif 4 (Überschriften, Uhrzeiten) – klassisch und gut lesbar
const sans = Source_Sans_3({ variable: "--font-text", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const serif = Source_Serif_4({ variable: "--font-titel", subsets: ["latin"], weight: ["600", "700"] });
// Verwaltung im Design der KBN-App: Plus Jakarta Sans (Text) und Bricolage Grotesque (Seitentitel).
// Nicht vorladen – die öffentliche Ansicht braucht sie nicht.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], preload: false });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], preload: false });

/** Name, Symbole und Startbilder aus der Verwaltung („Darstellung“) – zwischengespeichert, nach Änderung sofort neu */
export async function generateMetadata(): Promise<Metadata> {
  const m = await ladeMarke();
  const v = `?v=${m.logoStand}`;
  return {
    metadataBase: new URL(basisUrl()),
    title: { default: m.name, template: `%s · ${m.name}` },
    description: beschreibung(m),
    // Link-Vorschau in WhatsApp, iMessage, Signal …: Name, Unterzeile, Logo
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: m.name,
      title: m.name,
      description: beschreibung(m),
      images: [{ url: `/app-icon/512${v}`, width: 512, height: 512, alt: m.name }],
    },
    applicationName: m.name,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0, "max-image-preview": "none" },
    },
    icons: {
      icon: [{ url: `/app-icon/favicon${v}`, type: "image/png", sizes: "64x64" }],
      apple: [{ url: `/app-icon/apple${v}`, type: "image/png", sizes: "180x180" }],
    },
    appleWebApp: {
      capable: true,
      title: m.name,
      statusBarStyle: "black-translucent",
      // Startbildschirm mit Logo statt leerer Fläche beim Öffnen der App
      startupImage: STARTBILDER.map((s) => ({ url: `/startbild/${s.breite}x${s.hoehe}${v}`, media: s.media })),
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: FARBE_ROT,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: data-theme setzt das Skript vor React (hell/dunkel)
    <html lang="de" className={`${sans.variable} ${serif.variable} ${jakarta.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FARBSCHEMA_SKRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
        <Toaster />
        <DienstHelfer />
        <UpdateHinweis />
      </body>
    </html>
  );
}
