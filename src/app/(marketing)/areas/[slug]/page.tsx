import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/check-icon";
import { ClosingBand } from "@/components/closing-band";
import { textLinkClassName } from "@/components/cta-styles";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import {
  ArrowIcon,
  SectionHeading,
  sectionTitleClassName,
} from "@/components/section-heading";
import { WorkCard } from "@/components/work-card";
import {
  getServiceAreaBySlug,
  projects,
  serviceAreas,
  services,
} from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import { containerWide } from "@/lib/image-sizes";

export function generateStaticParams() {
  return serviceAreas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/areas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    return {
      title: "Area not found",
    };
  }

  return pageMetadata({
    title: `Building work in ${area.name}`,
    description: area.shortDescription,
    path: `/areas/${area.slug}`,
  });
}

export default async function AreaDetailPage({
  params,
}: PageProps<"/areas/[slug]">) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  const project = projects.find((item) => item.location === area.name);

  return (
    <>
      <PageHeader
        eyebrow="Areas"
        breadcrumb={{ href: "/about#areas", current: area.name }}
        title={`Builders in ${area.name}`}
        lede={area.shortDescription}
      />

      <section className="bg-page">
        <Reveal className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 lg:py-28">
          <div>
            <h2 className={sectionTitleClassName}>Working in {area.name}</h2>
            <p className="mt-6 max-w-[60ch] text-xl leading-relaxed text-ink/80">
              {area.longDescription}
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 p-6 lg:self-start lg:p-8">
            <h3 className="text-2xl leading-tight font-semibold text-ink">What we do here</h3>
            <ul className="mt-6 space-y-4 pointer-coarse:space-y-4.5">
              {services.map((service) => (
                <li
                  key={service.slug}
                  className="flex gap-3 text-base leading-relaxed text-ink/80"
                >
                  <CheckIcon />
                  <Link
                    href={`/services/${service.slug}`}
                    className="link-draw tap-target transition-colors duration-200 hover:text-accent"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {project ? (
        <section className="bg-panel">
          <Reveal className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-3 lg:gap-x-12 lg:py-28">
            <div className="flex flex-col">
              <SectionHeading eyebrow="Recent work nearby">
                A recent job in <em>{area.name}.</em>
              </SectionHeading>
              <div className="mt-8 lg:mt-auto">
                <Link href="/work" className={textLinkClassName}>
                  See all our work
                  <ArrowIcon />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-2">
              <WorkCard
                href={`/work/${project.slug}`}
                title={`${project.title}, ${project.location}`}
                description={project.shortDescription}
                imageSrc={project.image}
                imageAlt={project.imageAlt}
                sample={project.sample}
                sizes={`${containerWide(736)}, (max-width: 1023px) calc(100vw - 3rem), 736px`}
              />
            </div>
          </Reveal>
        </section>
      ) : null}

      <ClosingBand />
    </>
  );
}
