import type { MetadataRoute } from "next";
import {
  projects,
  serviceAreas,
  services,
  siteUrl,
} from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/services",
    "/work",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((service) => ({
    url: `${siteUrl}/services/${service.slug}`,
    lastModified: new Date(),
  }));

  const projectRoutes = projects.map((project) => ({
    url: `${siteUrl}/work/${project.slug}`,
    lastModified: new Date(),
  }));

  const areaRoutes = serviceAreas.map((area) => ({
    url: `${siteUrl}/areas/${area.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...serviceRoutes, ...projectRoutes, ...areaRoutes];
}
