import type { Metadata } from "next";

export const SITE_NAME = "Blue Peak";

export const OG_IMAGE_ALT =
  "Blue Peak - building and renovation across Ipswich and Suffolk";

/** Served by app/opengraph-image.tsx; resolved against `metadataBase`. */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: OG_IMAGE_ALT,
  type: "image/png",
};

type PageMetadataInput = {
  /** Page title; the root layout template appends " | Blue Peak". */
  title: string;
  /** Use the title as-is instead of applying the template. */
  absoluteTitle?: boolean;
  description: string;
  /** Route path such as "/services". Resolved against `metadataBase` (siteUrl). */
  path: string;
  /** Share image under /public, in place of the generated site card. */
  image?: { url: string; alt: string };
};

/**
 * Title, description, canonical, Open Graph and Twitter tags for a public page.
 * Nested metadata objects replace their parent's (including the file-based
 * og:image), so every page needs its own, images included.
 */
export function pageMetadata({
  title,
  absoluteTitle = false,
  description,
  path,
  image,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const images = [image ?? OG_IMAGE];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images,
    },
  };
}
