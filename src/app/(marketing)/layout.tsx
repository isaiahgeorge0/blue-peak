import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/content";
import { sitePhoneTel } from "@/lib/site";

/*
 * No company is registered yet, so there is no legal name or confirmed street
 * address. At launch, add: legalName (the registered company name), the
 * company number (e.g. as an identifier), and streetAddress and postalCode.
 */
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Blue Peak",
  description:
    "Building and renovation team covering Ipswich and the surrounding Suffolk area. Every trade under one roof, with a written quote before we start.",
  url: siteUrl,
  telephone: sitePhoneTel,
  priceRange: "££",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ipswich",
    addressRegion: "Suffolk",
    addressCountry: "GB",
  },
  areaServed: ["Ipswich", "Felixstowe", "Woodbridge", "Colchester"],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={localBusinessJsonLd} />
      <a
        href="#main"
        className="sr-only rounded-full bg-accent text-sm font-medium text-on-accent focus:not-sr-only focus:fixed focus:px-5 focus:py-3 focus:top-3 focus:left-3 focus:z-[60] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="w-full flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
