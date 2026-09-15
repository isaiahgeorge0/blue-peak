import type { Metadata } from "next";
import Link from "next/link";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
} from "@/components/cta-styles";
import { Reveal } from "@/components/reveal";
import { TrustBadges } from "@/components/trust-badges";
import { WorkCard } from "@/components/work-card";
import { roadmapFeatures } from "@/lib/roadmap";
import { teamMembers } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      absolute: "Blue Peak Solutions | Building and renovation in Ipswich",
    },
    description:
      "Kitchens, extensions, bathrooms, and refurbs across Ipswich and Suffolk. Written quotes before we start.",
  };
}

export default function HomePage() {
  return (
    <>
      {/* Hero: visible immediately, no scroll reveal */}
      <section className="bg-black">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="max-w-xl text-4xl leading-tight tracking-tight text-off-white sm:text-5xl lg:text-6xl">
              Building work you don&apos;t have to worry about
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-off-white/75">
              Kitchens, extensions, and refurbs across Ipswich and Suffolk,
              quoted in writing before we start.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className={primaryCtaClassName}>
                Get a quote
              </Link>
              <Link href="/work" className={secondaryCtaClassName}>
                See our work
              </Link>
            </div>
          </div>
          {/* Hero photo: replace this block with a finished-job photograph */}
          <div className="aspect-video w-full bg-gray-800" />
        </div>
      </section>

      <TrustBadges />

      {/* Stats strip */}
      <Reveal>
        <section className="border-b border-off-white/10 bg-charcoal">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3 sm:gap-6">
            <div>
              <p className="font-serif text-3xl text-off-white">12 years</p>
              <p className="mt-2 text-sm text-off-white/65">
                Trading as a two-person team in Ipswich
              </p>
            </div>
            <div>
              <p className="font-serif text-3xl text-off-white">180+ jobs</p>
              <p className="mt-2 text-sm text-off-white/65">
                Kitchens, bathrooms, extensions, and full refurbs completed
              </p>
            </div>
            <div>
              <p className="font-serif text-3xl text-off-white">Local patch</p>
              <p className="mt-2 text-sm text-off-white/65">
                Ipswich, Felixstowe, Woodbridge, and Colchester
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* How we work */}
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

      {/* Personal trust */}
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
                  {/* Profile photo placeholder */}
                  <div className="aspect-square h-24 w-24 shrink-0 bg-gray-800 sm:h-28 sm:w-28" />
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

      {/* Proof band */}
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
              />
              <WorkCard
                href="/work"
                title="Rear extension, Felixstowe"
                description="Single-storey addition opening onto the garden"
                photoNote="Felixstowe rear extension"
              />
              <WorkCard
                href="/work"
                title="Bathroom renovation, Woodbridge"
                description="Full strip-out, tiling, and a walk-in shower"
                photoNote="Woodbridge bathroom renovation"
              />
            </div>
          </div>
        </section>
      </Reveal>

      {/* Roadmap teaser */}
      <Reveal>
        <section className="bg-charcoal">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
                  What&apos;s next for Blue Peak
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-off-white/70">
                  Tools and ongoing work so quotes, crews, referrals, and local
                  search stay as organised as the work on site.
                </p>
              </div>
              <Link
                href="/roadmap"
                className="text-sm font-medium text-baby-blue transition-opacity hover:opacity-80"
              >
                View the roadmap
              </Link>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {roadmapFeatures.map((feature) => (
                <Link
                  key={feature.slug}
                  href={`/roadmap#${feature.slug}`}
                  className="group block border-t border-off-white/10 pt-5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <p className="text-xs font-medium tracking-wide text-baby-blue uppercase">
                    {feature.label}
                  </p>
                  <h3 className="mt-3 font-serif text-lg text-off-white transition-colors group-hover:text-baby-blue">
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-off-white/65">
                    {feature.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Final CTA */}
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
