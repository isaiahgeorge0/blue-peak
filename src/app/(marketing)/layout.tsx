import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/content";

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

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={localBusinessJsonLd} />
      <SiteHeader />
      <main className="w-full flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
