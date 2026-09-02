import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { site } from "@/lib/config";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Reflexología Holística | Podal, manos, cráneo-facial y lectura de pies",
  description:
    "Experiencias de reflexología holística: reflexología podal, acroreflexología, abordaje cráneo-facial y lectura de pies. Consultá modalidades y coordiná directamente por WhatsApp.",
  applicationName: site.brand.fullName,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Reflexología Holística",
    description:
      "Podal, manos, cráneo-facial y lectura de pies en una experiencia de bienestar coordinada por WhatsApp.",
    locale: "es_AR",
    type: "website",
    siteName: site.brand.fullName,
  },
  twitter: {
    card: "summary_large_image",
    title: "Reflexología Holística",
    description:
      "Experiencias de bienestar, presencia y cuidado personalizado.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    title: site.brand.descriptor,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0712",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-AR"
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
