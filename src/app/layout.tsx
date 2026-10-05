import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { HomeIntroScript } from "@/components/home/home-intro";
import { siteUrl } from "@/lib/content";
import { SITE_NAME } from "@/lib/page-metadata";
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
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Building and renovation team covering Ipswich and the surrounding Suffolk area. Every trade under one roof, with a written quote before we start.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_NAME,
    description:
      "Building and renovation team covering Ipswich and the surrounding Suffolk area. Every trade under one roof, with a written quote before we start.",
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1800ad",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <HomeIntroScript />
      </head>
      <body className="flex min-h-full flex-col bg-page font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
