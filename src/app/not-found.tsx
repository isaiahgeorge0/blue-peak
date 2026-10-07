import type { Metadata } from "next";
import Link from "next/link";
import { primaryCtaClassName } from "@/components/cta-styles";
import { PageHeader } from "@/components/page-header";
import { SiteChrome } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
};

// Renders inside the root layout only, outside the (marketing) layout, so it
// brings its own site header and footer.
export default function NotFound() {
  return (
    <SiteChrome>
      <PageHeader
        eyebrow="404"
        title="Page not found"
        lede="Sorry, we couldn't find the page you were looking for."
      >
        <Link href="/" className={primaryCtaClassName}>
          Back to the homepage
        </Link>
      </PageHeader>
    </SiteChrome>
  );
}
