import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import {
  brandBandPrimaryCtaClassName,
  textLinkClassName,
} from "@/components/cta-styles";
import { HomeHero } from "@/components/home/home-hero";
import { HomeIntro } from "@/components/home/home-intro";
import { HomeMotionIslands } from "@/components/home/home-motion-islands";
import { ReviewsSection } from "@/components/home/reviews-section";
import { ArrowIcon, SectionHeading } from "@/components/home/section-heading";
import { ServicesRail } from "@/components/home/services-rail";
import { SketchResolve } from "@/components/home/sketch-resolve";
import { Reveal } from "@/components/reveal";
import { TrustBadges } from "@/components/trust-badges";
import { WorkCard } from "@/components/work-card";
import { sitePhoneDisplay, sitePhoneTel, teamMembers } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Blue Peak Solutions | Building and renovation in Ipswich",
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
              Finished jobs across <em>Suffolk</em>.
            </SectionHeading>
            <ul className="-mx-6 mt-11 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto overscroll-x-contain px-6 py-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              <li className="w-[min(78vw,340px)] shrink-0 snap-start md:w-auto">
                <WorkCard
                  href="/work/ipswich-kitchen-dining"
                  title="Kitchen and dining refit, Ipswich"
                  description="New layout, units, and flooring in a Victorian terrace"
                  photoNote="Ipswich kitchen and dining refit"
                  imageSrc="/home/work-kitchen.jpg"
                />
              </li>
              <li className="w-[min(78vw,340px)] shrink-0 snap-start md:w-auto">
                <WorkCard
                  href="/work/felixstowe-rear-extension"
                  title="Rear extension, Felixstowe"
                  description="Single-storey addition opening onto the garden"
                  photoNote="Felixstowe rear extension"
                  imageSrc="/home/work-extension.jpg"
                />
              </li>
              <li className="w-[min(78vw,340px)] shrink-0 snap-start md:w-auto">
                <WorkCard
                  href="/work/woodbridge-bathroom"
                  title="Bathroom renovation, Woodbridge"
                  description="Full strip-out, tiling, and a walk-in shower"
                  photoNote="Woodbridge bathroom renovation"
                  imageSrc="/home/work-bathroom.jpg"
                />
              </li>
            </ul>

            <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-3 lg:gap-x-12">
              <div className="lg:col-start-1 lg:row-start-1">
                <h3 className="text-2xl text-ink lg:text-3xl">
                  See the difference
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/70">
                  Drag the handle, or use the arrow keys, to compare.
                </p>
              </div>
              <div className="lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <HomeMotionIslands />
              </div>
              <div className="mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-end">
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
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
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
                  <h3 className="mt-5 text-2xl text-ink">{member.name}</h3>
                  <p className="mt-1 text-sm tracking-wide text-accent">
                    {member.role}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {member.blurb}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="theme-brand border-b border-white/15 bg-page">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div>
              <SectionHeading eyebrow="Next step">
                Ready to get a <em>price</em> on the job?
              </SectionHeading>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
                Tell us what you&apos;re planning. We usually reply the same
                working day.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link href="/contact" className={brandBandPrimaryCtaClassName}>
                  Get a quote
                </Link>
                <a
                  href={`tel:${sitePhoneTel}`}
                  className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                >
                  Call {sitePhoneDisplay}
                </a>
              </div>
            </div>
            <div>
              <Link
                href="/quote"
                className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-white/15"
              >
                <Image
                  src="/home/quote-preview.jpg"
                  alt="3D quote calculator preview"
                  fill
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="object-cover"
                />
              </Link>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <p className="text-sm text-ink/80">
                  Or build a rough estimate in 3D
                </p>
                <Link href="/quote" className={textLinkClassName}>
                  Open the calculator
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
