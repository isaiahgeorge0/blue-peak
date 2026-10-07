import { JsonLd } from "@/components/JsonLd";
import { SiteChrome } from "@/components/site-chrome";
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
      <SiteChrome>{children}</SiteChrome>
    </>
  );
}
