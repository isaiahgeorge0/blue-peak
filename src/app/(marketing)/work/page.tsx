import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ClosingBand } from "@/components/closing-band";
import { textLinkClassName } from "@/components/cta-styles";
import { PageHeader } from "@/components/page-header";
import { PhotoGlide } from "@/components/photo-glide";
import { Reveal } from "@/components/reveal";
import { SampleTag } from "@/components/sample-tag";
import { ArrowIcon } from "@/components/section-heading";
import { WorkCard } from "@/components/work-card";
import { getServiceBySlug, projects } from "@/lib/content";
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
  const [featured, ...rest] = projects;
  const hasSamples = projects.some((project) => project.sample);
  const featuredServices = (featured.serviceSlugs ?? [])
    .map((slug) => getServiceBySlug(slug)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Recent work across Ipswich and Suffolk."
        lede="A sample of recent jobs. Each one was quoted in writing before we started."
      >
        {hasSamples ? (
          <p className="text-sm text-ink/70">
            Sample layout. Real Blue Peak projects will be added before launch.
          </p>
        ) : null}
      </PageHeader>

      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <Reveal className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center lg:gap-12">
            <Link
              href={`/work/${featured.slug}`}
              tabIndex={-1}
              aria-hidden
              className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-ink/10"
            >
              <Image
                src={featured.image}
                alt=""
                fill
                sizes="(max-width: 767px) calc(100vw - 3rem), (max-width: 1152px) 58vw, 650px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </Link>
            <div>
              {featured.sample ? <SampleTag /> : null}
              <h2 className="mt-5 text-3xl leading-tight tracking-tight text-ink lg:text-4xl">
                {featured.title}, {featured.location}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink/70">
                {featured.shortDescription}
              </p>
              {featuredServices ? (
                <p className="mt-4 text-sm text-ink/70">{featuredServices}</p>
              ) : null}
              <div className="mt-8">
                <Link
                  href={`/work/${featured.slug}`}
                  className={textLinkClassName}
                >
                  See the job
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </Reveal>

          <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8 lg:mt-20">
            {rest.map((project, index) => (
              <li key={project.slug}>
                <Reveal delay={index * 0.08}>
                  <WorkCard
                    href={`/work/${project.slug}`}
                    title={`${project.title}, ${project.location}`}
                    description={project.shortDescription}
                    imageSrc={project.image}
                    imageAlt={project.imageAlt}
                    sample={project.sample}
                  />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PhotoGlide />

      <ClosingBand />
    </>
  );
}
