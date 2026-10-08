import type { Metadata } from "next";
import { ClosingBand } from "@/components/closing-band";
import { PageOpener } from "@/components/page-opener";
import { PhotoGlide } from "@/components/photo-glide";
import { WorkPanels } from "@/components/work-panels";
import { getServiceBySlug, projects, type Service } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Work",
    description:
      "Recent kitchen, extension, bathroom, and refurb projects from Blue Peak across Ipswich and Suffolk.",
    path: "/work",
  });
}

export default function WorkPage() {
  const hasSamples = projects.some((project) => project.sample);
  const panels = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    location: project.location,
    shortDescription: project.shortDescription,
    image: project.image,
    imageAlt: project.imageAlt,
    sample: project.sample,
    services: (project.serviceSlugs ?? [])
      .map((slug) => getServiceBySlug(slug))
      .filter((service): service is Service => Boolean(service))
      .map(({ slug, name }) => ({ slug, name })),
  }));

  return (
    <>
      <PageOpener
        eyebrow="Work"
        title="Recent work across Ipswich and Suffolk."
        lede="A sample of recent jobs. Each one was quoted in writing before we started."
        image={{
          src: "/work/felixstowe-rear-extension/2.jpg",
          alt: "Inside the extension, looking out through open bifold doors to the garden",
          aspect: 4 / 3,
        }}
      >
        {hasSamples ? (
          <p className="text-sm text-white/85">
            Sample layout. Real Blue Peak projects will be added before launch.
          </p>
        ) : null}
      </PageOpener>

      <WorkPanels projects={panels} />

      <PhotoGlide />

      <ClosingBand />
    </>
  );
}
