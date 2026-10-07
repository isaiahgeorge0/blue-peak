import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/check-icon";
import { ClosingBand } from "@/components/closing-band";
import { textLinkClassName } from "@/components/cta-styles";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/reveal";
import { SampleTag } from "@/components/sample-tag";
import { ArrowIcon, sectionTitleClassName } from "@/components/section-heading";
import { WorkCard } from "@/components/work-card";
import {
  getProjectBySlug,
  getServiceBySlug,
  projects,
  siteUrl,
  type Service,
} from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

const panelHeadingClassName = "text-xl leading-tight font-semibold text-ink";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found",
    };
  }

  return pageMetadata({
    title: `${project.title}, ${project.location}`,
    description: project.shortDescription,
    path: `/work/${project.slug}`,
    image: { url: project.image, alt: project.imageAlt },
  });
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const index = projects.findIndex((item) => item.slug === project.slug);
  const moreProjects = [1, 2].map(
    (offset) => projects[(index + offset) % projects.length],
  );
  const services = (project.serviceSlugs ?? [])
    .map((serviceSlug) => getServiceBySlug(serviceSlug))
    .filter((service): service is Service => Boolean(service));
  const [leadPhoto, ...sidePhotos] = project.gallery;

  /*
   * Breadcrumbs only. CreativeWork, Review or similar structured data can be
   * added once the projects are real jobs rather than samples.
   */
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Work",
        item: `${siteUrl}/work`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: project.title,
        item: `${siteUrl}/work/${project.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />

      <section className="bg-panel">
        <div className="mx-auto max-w-6xl px-6 pt-38 pb-20 lg:pt-46 lg:pb-28">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 text-xs font-bold tracking-[0.2em] uppercase">
              <li>
                <Link
                  href="/work"
                  className="link-draw text-accent"
                >
                  Work
                </Link>
              </li>
              <li aria-hidden className="text-ink/40">
                /
              </li>
              <li>
                <span aria-current="page" className="text-ink/70">
                  {project.title}
                </span>
              </li>
            </ol>
          </nav>
          {project.sample ? <SampleTag onFrost className="mt-6" /> : null}
          <h1 className="mt-4 max-w-4xl text-display-sm leading-display tracking-heading text-ink lg:text-7xl lg:tracking-display">
            {project.title}, {project.location}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink/70">
            {project.shortDescription}
          </p>
          <div className="relative mt-12 aspect-[4/3] overflow-hidden rounded-xl bg-ink/10 md:aspect-video lg:mt-16">
            <Image
              src={project.image}
              alt={project.imageAlt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 1152px) calc(100vw - 3rem), 1104px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-page">
        <Reveal className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 lg:py-28">
          <div>
            <h2 className={sectionTitleClassName}>The job</h2>
            <p className="mt-6 max-w-[60ch] text-xl leading-relaxed text-ink/80">
              {project.longDescription}
            </p>
          </div>
          <div className="divide-y divide-ink/10 rounded-xl border border-ink/10 px-6 lg:self-start lg:px-8">
            <div className="py-6 lg:py-8">
              <h3 className={panelHeadingClassName}>What we did</h3>
              <ul className="mt-5 space-y-4">
                {project.scope.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-base leading-relaxed text-ink/80"
                  >
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {services.length > 0 ? (
              <div className="py-6 lg:py-8">
                <h3 className={panelHeadingClassName}>Services</h3>
                <ul className="mt-4 space-y-2">
                  {services.map((service) => (
                    <li key={service.slug}>
                      <Link
                        href={`/services/${service.slug}`}
                        className={textLinkClassName}
                      >
                        {service.name}
                        <ArrowIcon />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="py-6 lg:py-8">
              <h3 className={panelHeadingClassName}>Location</h3>
              <p className="mt-3 text-base text-ink/80">{project.location}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {leadPhoto ? (
        <section aria-labelledby="photos-heading" className="bg-panel">
          <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <h2 id="photos-heading" className="sr-only">
              Photos from the job
            </h2>
            <ul className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-2">
              <li className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/10 md:row-span-2">
                <Image
                  src={leadPhoto.src}
                  alt={leadPhoto.alt}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1152px) 66vw, 728px"
                  className="object-cover"
                />
              </li>
              {sidePhotos.map((photo) => (
                <li
                  key={photo.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink/10 md:aspect-auto"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1152px) 33vw, 364px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}

      <section className="bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
            <h2 className={sectionTitleClassName}>More work</h2>
            <Link href="/work" className={textLinkClassName}>
              See all our work
              <ArrowIcon />
            </Link>
          </div>
          <ul className="mt-11 grid gap-12 md:grid-cols-2 md:gap-8">
            {moreProjects.map((other) => (
              <li key={other.slug}>
                <WorkCard
                  href={`/work/${other.slug}`}
                  title={`${other.title}, ${other.location}`}
                  description={other.shortDescription}
                  imageSrc={other.image}
                  imageAlt={other.imageAlt}
                  sample={other.sample}
                  sizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1152px) 50vw, 536px"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <ClosingBand />
    </>
  );
}
