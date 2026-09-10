import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Blue Peak Solutions",
    template: "%s | Blue Peak Solutions",
  },
  description:
    "Two-person building and renovation team covering Ipswich and the surrounding Suffolk area. Clear quotes before we start.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Blue Peak Solutions",
    description:
      "Two-person building and renovation team covering Ipswich and the surrounding Suffolk area. Clear quotes before we start.",
    siteName: "Blue Peak Solutions",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Blue Peak Solutions",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Blue Peak Solutions",
  description:
    "Two-person building and renovation team covering Ipswich and the surrounding Suffolk area.",
  url: siteUrl,
  telephone: "+441234567890",
  priceRange: "££",
  address: {
    "@type": "PostalAddress",
    streetAddress: "14 St Helens Street",
    addressLocality: "Ipswich",
    addressRegion: "Suffolk",
    postalCode: "IP4 1HH",
    addressCountry: "GB",
  },
  areaServed: ["Ipswich", "Felixstowe", "Woodbridge", "Colchester"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-charcoal font-sans text-off-white">
        <JsonLd data={localBusinessJsonLd} />
        <SiteHeader />
        <main className="w-full flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
