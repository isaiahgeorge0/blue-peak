import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Tinos } from "next/font/google";
import { HomeIntroScript } from "@/components/home/home-intro";
import { siteLive, siteUrl } from "@/lib/content";
import { SITE_NAME } from "@/lib/page-metadata";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

/**
 * Metric-compatible stand-in for Times New Roman, used only on devices that
 * lack it. --font-serif lists Times New Roman first, so browsers that have it
 * never request these files; hence no preload.
 */
const tinos = Tinos({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-tinos",
  preload: false,
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
    index: siteLive,
    follow: siteLive,
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
      className={`${nunitoSans.variable} ${tinos.variable} h-full antialiased`}
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
