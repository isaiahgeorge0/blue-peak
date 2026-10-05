import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { primaryCtaClassName } from "@/components/cta-styles";
import { teamMembers } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "About",
    description:
      "Meet the Ipswich building and renovation team behind Blue Peak Solutions. Every trade under one roof, a written quote before we start, and a founder running every job.",
    path: "/about",
  });
}

export default function AboutPage() {
  return (
    <>
      {/* Brand story */}
      <section className="bg-panel">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <p className="text-sm font-medium tracking-wide text-accent uppercase">
            About
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            A small Ipswich team that stays on the job
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
            Blue Peak Solutions is a building and renovation team covering
            Ipswich and the surrounding Suffolk area. Every trade under one
            roof, with a written quote before we start, and Kyle or Steven
            running every job.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/70">
            We care about tidy sites, honest timescales, and finishes that hold
            up. Most of our work is for homeowners across Suffolk who want a
            clear written price before anything starts, and a team that does not
            disappear halfway through.
          </p>
        </div>
      </section>

      {/* How we're different */}
      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-ink sm:text-4xl">
            How we&apos;re different
          </h2>
          <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <li>
              <p className="text-sm font-medium tracking-wide text-accent">
                01
              </p>
              <h3 className="mt-3 text-xl text-ink">Fixed written quotes</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                We visit, measure up, and send a clear price before any work is
                booked. No vague estimates once we are on site.
              </p>
            </li>
            <li>
              <p className="text-sm font-medium tracking-wide text-accent">
                02
              </p>
              <h3 className="mt-3 text-xl text-ink">A founder on every job</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Kyle or Steven runs your job from first visit to final tidy, so
                you always know who is in charge and who to call.
              </p>
            </li>
            <li>
              <p className="text-sm font-medium tracking-wide text-accent">
                03
              </p>
              <h3 className="mt-3 text-xl text-ink">Local to Suffolk</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Based in Ipswich and covering Felixstowe, Woodbridge,
                Colchester, and nearby towns. Short travel means we can stay on
                the job.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="bg-panel">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-ink sm:text-4xl">
            The team
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <div key={member.name}>
                {/* Placeholder until real headshots are supplied. */}
                <div className="flex aspect-square max-w-xs items-center justify-center bg-page">
                  <BrandMark title="" className="h-14 w-auto text-brand/15" />
                </div>
                <h3 className="mt-5 font-serif text-2xl text-ink">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm tracking-wide text-accent">
                  {member.role}
                </p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/70">
                  {member.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
          <h2 className="text-3xl tracking-tight text-ink sm:text-4xl">
            Want to talk through a job?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/75">
            Send a few details and we will reply the same working day with a
            clear next step.
          </p>
          <div className="mt-8">
            <Link href="/contact" className={primaryCtaClassName}>
              Get a quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
