import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { ClosingBand } from "@/components/closing-band";
import { textLinkClassName } from "@/components/cta-styles";
import { HomeHero } from "@/components/home/home-hero";
import { HomeIntro } from "@/components/home/home-intro";
import { HomeMotionIslands } from "@/components/home/home-motion-islands";
import { ReviewsSection } from "@/components/home/reviews-section";
import { ArrowIcon, SectionHeading } from "@/components/section-heading";
import { ServicesRail } from "@/components/home/services-rail";
import { SketchResolve } from "@/components/home/sketch-resolve";
import { Reveal } from "@/components/reveal";
import { TrustBadges } from "@/components/trust-badges";
import { WorkCard } from "@/components/work-card";
import { projects } from "@/lib/content";
import { teamMembers } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Blue Peak | Building and renovation in Ipswich",
    absoluteTitle: true,
    description:
      "Kitchens, extensions, bathrooms, and refurbs across Ipswich and Suffolk. Written quotes before we start.",
    path: "/",
  });
}

export default function HomePage() {
  return (
    <>
      <HomeIntro />

      <HomeHero />

      <TrustBadges />

      <ServicesRail />

      <Reveal>
        <section className="bg-panel">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <SectionHeading eyebrow="Recent work">
              Finished jobs across <em>Suffolk.</em>
            </SectionHeading>
            <ul className="-mx-6 mt-11 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto overscroll-x-contain px-6 py-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              {projects.slice(0, 3).map((project) => (
                <li
                  key={project.slug}
                  className="w-[min(78vw,340px)] shrink-0 snap-start md:w-auto"
                >
                  <WorkCard
                    href={`/work/${project.slug}`}
                    title={`${project.title}, ${project.location}`}
                    description={project.shortDescription}
                    imageSrc={project.image}
                    imageAlt={project.imageAlt}
                    sample={project.sample}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-14 lg:mt-20">
              <h3 className="text-2xl font-semibold text-ink lg:text-3xl">
                See the difference
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70">
                Drag the handle, or use the arrow keys, to compare.
              </p>
              <div className="-mx-2 mt-8 sm:mx-0 lg:mt-10">
                <HomeMotionIslands />
              </div>
              <div className="mt-8 lg:mt-10">
                <Link href="/work" className={textLinkClassName}>
                  See all our work
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <ReviewsSection />
      </Reveal>

      <SketchResolve />

      <Reveal>
        <section className="bg-page">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:py-28">
            <div>
              <SectionHeading eyebrow="Who you'll deal with">
                Led by Kyle and Steven.
              </SectionHeading>
              <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink/70">
                Blue Peak brings every trade under one roof, and the two
                founders run every job. You deal with Kyle or Steven from the
                first visit to the final tidy-up.
              </p>
              <div className="mt-8">
                <Link href="/about" className={textLinkClassName}>
                  More about us
                  <ArrowIcon />
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-[280px_280px]">
              {teamMembers.map((member) => (
                <li key={member.name}>
                  {/* Placeholder until real headshots are supplied. */}
                  <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-panel">
                    <BrandMark title="" className="h-14 w-auto text-brand/15" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-ink">{member.name}</h3>
                  <p className="mt-1 text-sm tracking-wide text-accent">
                    {member.role}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-ink/70">
                    {member.blurb}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <ClosingBand />
    </>
  );
}
