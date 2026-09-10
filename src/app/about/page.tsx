import type { Metadata } from "next";
import Link from "next/link";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About",
    description:
      "Meet the two-person Ipswich building team behind Blue Peak Solutions. Fixed written quotes, local Suffolk work, and the same people on every job.",
  };
}

export default function AboutPage() {
  return (
    <>
      {/* Brand story */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <p className="text-sm font-medium tracking-wide text-baby-blue uppercase">
            About
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl tracking-tight text-off-white sm:text-5xl lg:text-6xl">
            A small Ipswich team that stays on the job
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-off-white/75">
            Blue Peak Solutions is a two-person building and renovation company
            based in Ipswich. We take on kitchens, bathrooms, extensions, and
            full refurbs ourselves, so you deal with the people who actually do
            the work.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-off-white/70">
            We care about tidy sites, honest timescales, and finishes that hold
            up. Most of our work is for homeowners across Suffolk who want a
            clear written price before anything starts, and a team that does not
            disappear halfway through.
          </p>
        </div>
      </section>

      {/* How we're different */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            How we&apos;re different
          </h2>
          <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <li>
              <p className="text-sm font-medium tracking-wide text-baby-blue">
                01
              </p>
              <h3 className="mt-3 text-xl text-off-white">
                Fixed written quotes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                We visit, measure up, and send a clear price before any work is
                booked. No vague estimates once we are on site.
              </p>
            </li>
            <li>
              <p className="text-sm font-medium tracking-wide text-baby-blue">
                02
              </p>
              <h3 className="mt-3 text-xl text-off-white">
                Same two people every job
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                You get the same pair from first visit to final tidy. No rotating
                subcontractors and no guessing who is turning up.
              </p>
            </li>
            <li>
              <p className="text-sm font-medium tracking-wide text-baby-blue">
                03
              </p>
              <h3 className="mt-3 text-xl text-off-white">Local to Suffolk</h3>
              <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                Based in Ipswich and covering Felixstowe, Woodbridge, Colchester,
                and nearby towns. Short travel means we can stay on the job.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            The team
          </h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              {/* Profile photo placeholder */}
              <div className="aspect-square max-w-xs bg-gray-800" />
              <h3 className="mt-5 font-serif text-2xl text-off-white">
                Tom Harris
              </h3>
              <p className="mt-1 text-sm tracking-wide text-baby-blue">
                Builder and co-founder
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-off-white/70">
                Handles structure, joinery, and the day-to-day sequencing on
                site so each job stays tidy and on track.
              </p>
            </div>
            <div>
              {/* Profile photo placeholder */}
              <div className="aspect-square max-w-xs bg-gray-800" />
              <h3 className="mt-5 font-serif text-2xl text-off-white">
                James Cole
              </h3>
              <p className="mt-1 text-sm tracking-wide text-baby-blue">
                Builder and co-founder
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-off-white/70">
                Focuses on finishes, client updates, and making sure the written
                quote matches what gets delivered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            Want to talk through a job?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-off-white/75">
            Send a few details and we will reply the same working day with a
            clear next step.
          </p>
          <div className="mt-8">
            <Link href="/contact" className={quoteButtonClassName}>
              Get a quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
