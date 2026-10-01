import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
} from "@/components/cta-styles";
import { AnimatedStats } from "@/components/home/animated-stats";
import { HomeHero } from "@/components/home/home-hero";
import { HomeMotionIslands } from "@/components/home/home-motion-islands";
import { PhotoGlide } from "@/components/home/photo-glide";
import { SketchResolve } from "@/components/home/sketch-resolve";
import { Reveal } from "@/components/reveal";
import { TrustBadges } from "@/components/trust-badges";
import { WorkCard } from "@/components/work-card";
import { teamMembers } from "@/lib/site";
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
      <HomeHero />

      <TrustBadges />

      <Reveal>
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
              Recent work
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <WorkCard
                href="/work"
                title="Kitchen and dining refit, Ipswich"
                description="New layout, units, and flooring in a Victorian terrace"
                photoNote="Ipswich kitchen and dining refit"
                imageSrc="/home/work-kitchen.jpg"
              />
              <WorkCard
                href="/work"
                title="Rear extension, Felixstowe"
                description="Single-storey addition opening onto the garden"
                photoNote="Felixstowe rear extension"
                imageSrc="/home/work-extension.jpg"
              />
              <WorkCard
                href="/work"
                title="Bathroom renovation, Woodbridge"
                description="Full strip-out, tiling, and a walk-in shower"
                photoNote="Woodbridge bathroom renovation"
                imageSrc="/home/work-bathroom.jpg"
              />
            </div>
          </div>
        </section>
      </Reveal>

      <PhotoGlide />

      <HomeMotionIslands />

      <AnimatedStats />

      <Reveal>
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
              How we work
            </h2>
            <ol className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
              <li>
                <p className="text-sm font-medium tracking-wide text-baby-blue">
                  01
                </p>
                <h3 className="mt-3 text-xl text-off-white">Enquire</h3>
                <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                  Tell us what you want doing and send a few photos. We will say
                  quickly whether it is a job we can take on.
                </p>
              </li>
              <li>
                <p className="text-sm font-medium tracking-wide text-baby-blue">
                  02
                </p>
                <h3 className="mt-3 text-xl text-off-white">Get a fixed quote</h3>
                <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                  We visit the property, measure up, and send a written price
                  before any work is booked.
                </p>
              </li>
              <li>
                <p className="text-sm font-medium tracking-wide text-baby-blue">
                  03
                </p>
                <h3 className="mt-3 text-xl text-off-white">Book the work</h3>
                <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                  Agree a start date, we protect the house, and we stay on it
                  until the job is finished.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-charcoal">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
              Who you&apos;ll actually be dealing with
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-off-white/70">
              Blue Peak is two people on every job. You speak to the same pair
              from the first site visit through to the final tidy-up.
            </p>
            <div className="mt-10 grid gap-10 sm:grid-cols-2">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex gap-5">
                  <div className="relative aspect-square h-24 w-24 shrink-0 overflow-hidden bg-gray-800 sm:h-28 sm:w-28">
                    <Image
                      src={member.imageSrc}
                      alt={`${member.name}, ${member.role}`}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-off-white">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-sm tracking-wide text-baby-blue">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                      {member.blurb}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <SketchResolve />

      <Reveal>
        <section className="bg-black">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
            <div>
              <p className="text-xs font-medium tracking-wide text-baby-blue uppercase">
                Quote calculator
              </p>
              <h2 className="mt-3 text-3xl tracking-tight text-off-white sm:text-4xl">
                See a live estimate in 3D
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-off-white/70">
                Toggle loft conversions, extensions, and finishes on a house you
                can orbit. Figures are for scoping a conversation, then we visit
                for a written price.
              </p>
              <div className="mt-8">
                <Link href="/quote" className={primaryCtaClassName}>
                  Open the calculator
                </Link>
              </div>
            </div>
            <Link
              href="/quote"
              className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-off-white/10 bg-charcoal"
            >
              <Image
                src="/home/quote-preview.jpg"
                alt="3D isometric house quote calculator preview"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-left"
              />
            </Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
            <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
              Ready to get a price on the job?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-off-white/75">
              Tell us what you are planning. We usually reply the same working
              day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className={primaryCtaClassName}>
                Get a quote
              </Link>
              <Link href="/work" className={secondaryCtaClassName}>
                See our work
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
