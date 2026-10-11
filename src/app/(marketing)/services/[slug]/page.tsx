import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand/brand-logo";
import { CheckIcon } from "@/components/check-icon";
import { ClosingBand } from "@/components/closing-band";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
  textLinkClassName,
} from "@/components/cta-styles";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/reveal";
import {
  ArrowIcon,
  SectionHeading,
  sectionTitleClassName,
} from "@/components/section-heading";
import { WorkCard } from "@/components/work-card";
import {
  getProjectsForService,
  getServiceBySlug,
  services,
  siteUrl,
} from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import { howWeWorkSteps } from "@/lib/site";
import { containerWide } from "@/lib/image-sizes";

const focusRingClassName =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service not found",
    };
  }

  return pageMetadata({
    title: service.name,
    description: service.shortDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const index = services.findIndex((item) => item.slug === service.slug);
  const otherServices = [1, 2, 3].map(
    (offset) => services[(index + offset) % services.length],
  );
  const project = getProjectsForService(service.slug)[0];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Services",
        item: `${siteUrl}/services`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: service.name,
        item: `${siteUrl}/services/${service.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />

      <section className="bg-panel">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-38 pb-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-16 lg:pt-46 lg:pb-28">
          <div>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-x-2 text-xs font-bold tracking-[0.2em] uppercase">
                <li>
                  <Link
                    href="/services"
                    className="link-draw tap-target text-accent"
                  >
                    Services
                  </Link>
                </li>
                <li aria-hidden className="text-ink/40">
                  /
                </li>
                <li>
                  <span aria-current="page" className="text-ink/70">
                    {service.name}
                  </span>
                </li>
              </ol>
            </nav>
            <h1 className="page-title mt-4 text-ink">
              {service.name}
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink/70">
              {service.shortDescription}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className={primaryCtaClassName}>
                <span className="cta-label">Get a quote</span>
              </Link>
              <Link href="/quote" className={secondaryCtaClassName}>
                Build an estimate
              </Link>
            </div>
          </div>

          <div className="@container w-full">
            <div className="pitch-top relative aspect-[4/3] w-full overflow-hidden bg-ink/10 max-lg:[--pitch-run:50cqw] lg:aspect-[3/4]">
              {service.image ? (
                <Image
                  src={service.image}
                  alt={service.imageAlt ?? ""}
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes={`${containerWide(420)}, (max-width: 1023px) calc(100vw - 3rem), 420px`}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BrandMark title="" className="h-14 w-auto text-brand/15" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-page">
        <Reveal className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 lg:py-28">
          <div>
            <h2 className={sectionTitleClassName}>What&apos;s involved</h2>
            <p className="mt-6 max-w-[60ch] text-xl leading-relaxed text-ink/80">
              {service.longDescription}
            </p>
          </div>
          <div className="rounded-xl border border-ink/10 p-6 lg:self-start lg:p-8">
            <h3 className="text-2xl leading-tight font-semibold text-ink">
              Typically includes
            </h3>
            <ul className="mt-6 space-y-4">
              {service.includes.map((item) => (
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
        </Reveal>
      </section>

      <section className="theme-brand bg-page">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="How we work">
            From first call to <em>final tidy-up.</em>
          </SectionHeading>
          <ol className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-8 lg:mt-16 lg:grid-cols-4 lg:gap-x-10">
            {howWeWorkSteps.map((step, stepIndex) => (
              <li key={step.title} className="border-t border-white/20 pt-6">
                <h3 className="flex items-baseline gap-3 text-2xl leading-tight font-semibold text-ink">
                  <span className="text-sm font-bold tracking-[0.2em] text-accent">
                    {String(stepIndex + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-ink/80">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Link
              href="/#how-we-work"
              className={`${textLinkClassName} ${focusRingClassName}`}
            >
              See how we work
              <ArrowIcon />
            </Link>
          </div>
        </Reveal>
      </section>

      {project ? (
        <section className="bg-page">
          <Reveal className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-3 lg:gap-x-12 lg:py-28">
            <div className="flex flex-col">
              <SectionHeading eyebrow="Recent work">
                A recent job in <em>{project.location}.</em>
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

      <section className="bg-panel">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
            <h2 className={sectionTitleClassName}>More services</h2>
            <Link href="/services" className={textLinkClassName}>
              See all services
              <ArrowIcon />
            </Link>
          </div>
          <ul className="mt-11 grid gap-6 sm:grid-cols-3 lg:gap-8">
            {otherServices.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/services/${other.slug}`}
                  className={`group block rounded-xl ${focusRingClassName}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-page">
                    {other.image ? (
                      <Image
                        src={other.image}
                        alt={other.imageAlt ?? ""}
                        fill
                        sizes={`${containerWide(352)}, (max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) 30vw, 352px`}
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BrandMark title="" className="h-14 w-auto text-brand/15" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <h3 className="text-xl leading-tight font-semibold text-ink transition-colors duration-200 group-hover:text-accent">
                      {other.name}
                    </h3>
                    <ArrowIcon className="mt-1 shrink-0 text-accent" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <ClosingBand />
    </>
  );
}
