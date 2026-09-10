import type { Metadata } from "next";
import Link from "next/link";
import { roadmapFeatures } from "@/lib/roadmap";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90";

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
      {/* Hero */}
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
            <div className="mt-8">
              <Link href="/contact" className={quoteButtonClassName}>
                Get a quote
              </Link>
            </div>
          </div>
          {/* Hero photo: replace this block with a finished-job photograph */}
          <div className="aspect-video w-full bg-gray-800" />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-off-white/10 bg-charcoal">
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

      {/* How we work */}
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

      {/* Proof band */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            Recent work
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Link href="/work" className="group block">
              {/* Project photo: Ipswich kitchen and dining refit */}
              <div className="aspect-video bg-gray-800" />
              <p className="mt-4 font-serif text-lg text-off-white group-hover:text-baby-blue">
                Kitchen and dining refit, Ipswich
              </p>
              <p className="mt-1 text-sm text-off-white/65">
                New layout, units, and flooring in a Victorian terrace
              </p>
            </Link>
            <Link href="/work" className="group block">
              {/* Project photo: Felixstowe rear extension */}
              <div className="aspect-video bg-gray-800" />
              <p className="mt-4 font-serif text-lg text-off-white group-hover:text-baby-blue">
                Rear extension, Felixstowe
              </p>
              <p className="mt-1 text-sm text-off-white/65">
                Single-storey addition opening onto the garden
              </p>
            </Link>
            <Link href="/work" className="group block">
              {/* Project photo: Woodbridge bathroom renovation */}
              <div className="aspect-video bg-gray-800" />
              <p className="mt-4 font-serif text-lg text-off-white group-hover:text-baby-blue">
                Bathroom renovation, Woodbridge
              </p>
              <p className="mt-1 text-sm text-off-white/65">
                Full strip-out, tiling, and a walk-in shower
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmap teaser */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
                What&apos;s next for Blue Peak
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-off-white/70">
                Tools we are building so quotes, crews, and referrals stay as
                organised as the work on site.
              </p>
            </div>
            <Link
              href="/roadmap"
              className="text-sm font-medium text-baby-blue transition-opacity hover:opacity-80"
            >
              View the roadmap
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {roadmapFeatures.map((feature) => (
              <Link
                key={feature.slug}
                href={`/roadmap#${feature.slug}`}
                className="group block border-t border-off-white/10 pt-5"
              >
                <p className="text-xs font-medium tracking-wide text-baby-blue uppercase">
                  {feature.label}
                </p>
                <h3 className="mt-3 font-serif text-lg text-off-white group-hover:text-baby-blue">
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

      {/* Final CTA */}
      <section className="bg-charcoal">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            Ready to get a price on the job?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-off-white/75">
            Tell us what you are planning. We usually reply the same working
            day.
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
