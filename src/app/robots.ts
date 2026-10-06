import type { MetadataRoute } from "next";
import { siteLive, siteUrl } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: siteLive
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
