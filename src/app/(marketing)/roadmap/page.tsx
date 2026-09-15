import type { Metadata } from "next";
import Link from "next/link";
import { roadmapFeatures } from "@/lib/roadmap";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Roadmap",
    description:
      "What Blue Peak Solutions is building next: subcontractor CRM, quotes and invoices, referrals, and ongoing local SEO for Ipswich and Suffolk.",
  };
}

export default function RoadmapPage() {
  return (
    <>
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <p className="text-sm font-medium tracking-wide text-baby-blue uppercase">
            Roadmap
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl tracking-tight text-off-white sm:text-5xl lg:text-6xl">
            What we are building next
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-off-white/75">
            Blue Peak already runs on clear quotes and tidy sites. These are the
            next steps so the business behind the build stays as organised as
            the work on site, and so local homeowners can find us when they
            search.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-off-white/70">
            Three of these are tools still on the way. Local SEO is ongoing
            work we keep investing in, because search visibility does not stay
            put on its own. If you are a homeowner, it simply means a smoother
            experience as we grow. If you run a trade business yourself, it is
            a look at the ceiling of what a small team can run with the right
            systems.
          </p>
        </div>
      </section>

      <section className="bg-charcoal">
        <div className="mx-auto max-w-6xl space-y-12 px-6 py-16 lg:space-y-16 lg:py-20">
          {roadmapFeatures.map((feature, index) => (
            <article
              key={feature.slug}
              id={feature.slug}
              className="scroll-mt-28 border-t border-off-white/10 pt-10 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium tracking-wide text-baby-blue">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <span className="rounded-full border border-baby-blue/40 px-3 py-1 text-xs font-medium tracking-wide text-baby-blue uppercase">
                  {feature.label}
                </span>
              </div>
              <h2 className="mt-4 text-2xl tracking-tight text-off-white sm:text-3xl">
                {feature.name}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-off-white/80">
                {feature.summary}
              </p>
              <h3 className="mt-8 text-sm font-medium tracking-wide text-baby-blue uppercase">
                Why it matters
              </h3>
              {feature.whyItMatters.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 max-w-2xl text-base leading-relaxed text-off-white/70"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
            Still just want a quote?
          </h2>
          <p className="mt-4 max-w-xl text-base text-off-white/75">
            The roadmap is for how we run and grow the business. If you have a
            kitchen, bathroom, extension, or refurb in mind, we are ready to
            price it now.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Get a quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
