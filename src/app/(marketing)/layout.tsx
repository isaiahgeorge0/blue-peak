import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/content";
import { sitePhoneTel } from "@/lib/site";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Blue Peak Solutions",
  description:
    "Two-person building and renovation team covering Ipswich and the surrounding Suffolk area.",
  url: siteUrl,
  telephone: sitePhoneTel,
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
