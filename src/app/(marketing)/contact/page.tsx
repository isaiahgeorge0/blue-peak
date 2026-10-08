import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { secondaryCtaClassName } from "@/components/cta-styles";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { serviceAreas, services } from "@/lib/content";
import { howWeWorkSteps, sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Contact",
    description:
      "Request a written quote for kitchen, bathroom, extension, or renovation work from Blue Peak.",
    path: "/contact",
  });
}

const detailHeadingClassName =
  "font-sans text-xs font-bold tracking-[0.2em] text-accent uppercase";

export default function ContactPage() {
  const serviceOptions = services.map((service) => ({
    slug: service.slug,
    name: service.name,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get a quote"
        lede="Tell us what you are planning. We usually reply the same working day with a clear next step."
      />

      <section className="bg-page">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16 lg:py-28">
          {/* First in the source so it leads on phones; placed right on desktop. */}
          <div
            id="quote-form"
            className="scroll-mt-28 rounded-lg border border-ink/10 bg-panel px-6 py-8 sm:px-8 lg:col-start-2 lg:row-start-1 lg:self-start"
          >
            <ContactForm services={serviceOptions} />
          </div>

          <Reveal className="space-y-12 lg:col-start-1 lg:row-start-1">
            <div>
              <h2 className={detailHeadingClassName}>Phone</h2>
              <a
                href={`tel:${sitePhoneTel}`}
                className="mt-3 inline-block font-serif text-5xl tracking-display text-ink transition-colors duration-200 hover:text-accent lg:text-6xl"
              >
                {sitePhoneDisplay}
              </a>
            </div>

            <div>
              <h2 className={detailHeadingClassName}>What happens next</h2>
              <ol className="mt-5 space-y-5">
                {howWeWorkSteps.slice(0, 3).map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="pt-1 text-sm font-bold tracking-[0.2em] text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-xl leading-tight font-semibold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-base leading-relaxed text-ink/70">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className={detailHeadingClassName}>Areas we cover</h2>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 pointer-coarse:gap-y-5.5">
                {serviceAreas.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/areas/${area.slug}`}
                      className="tap-target relative text-base text-ink underline decoration-ink/30 underline-offset-4 transition-colors duration-200 hover:text-accent hover:decoration-accent"
                    >
                      {area.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-panel">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between md:gap-12 lg:py-14">
          <div>
            <h2 className="text-2xl leading-tight tracking-heading text-ink lg:text-3xl">
              Not ready to talk yet?
            </h2>
            <p className="mt-2 max-w-xl text-lg leading-relaxed text-ink/70">
              Build a rough estimate in 3D and see a guide price in a couple of
              minutes.
            </p>
          </div>
          <Link
            href="/quote"
            className={`${secondaryCtaClassName} shrink-0 self-start md:self-auto`}
          >
            Build an estimate
          </Link>
        </Reveal>
      </section>
    </>
  );
}
