import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { secondaryCtaClassName } from "@/components/cta-styles";
import { NextSteps } from "@/components/next-steps";
import { SplitOpener } from "@/components/split-opener";
import { serviceAreas, services } from "@/lib/content";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
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

/** The form column's right edge lines up with the main container's from lg. */
const containerInsetRight =
  "lg:pr-[max(1.5rem,calc((100vw-var(--container-6xl))/2+1.5rem))]";

export default function ContactPage() {
  const serviceOptions = services.map((service) => ({
    slug: service.slug,
    name: service.name,
  }));

  return (
    <>
      <SplitOpener
        eyebrow="Contact"
        title="Get a quote"
        lede="Tell us what you are planning. We usually reply the same working day with a clear next step."
        image={{
          src: "/services/general-renovations.jpg",
          alt: "Renovated Victorian hallway with a patterned tiled floor, painted panelling and a white staircase",
        }}
        aside={
          <div
            className={`px-6 pt-8 pb-20 lg:pt-[calc(var(--site-header-height)+3rem)] lg:pb-28 lg:pl-12 xl:pl-16 ${containerInsetRight}`}
          >
            <div
              id="quote-form"
              className="max-w-xl scroll-mt-[calc(var(--site-header-height)+1.5rem)] lg:max-w-none"
            >
              <ContactForm
                services={serviceOptions}
                nextSteps={<NextSteps />}
              />
            </div>

            <div className="mt-16 border-t border-ink/15 pt-8">
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
          </div>
        }
      >
        <a
          href={`tel:${sitePhoneTel}`}
          className="link-draw tap-target font-serif text-4xl tracking-display text-ink lg:text-6xl lg:text-white"
        >
          {sitePhoneDisplay}
        </a>
      </SplitOpener>

      <section className="bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between md:gap-12 lg:py-20">
          <div>
            <h2 className="text-3xl leading-tight tracking-heading text-ink lg:text-5xl lg:tracking-display">
              Not ready to talk yet?
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink/70">
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
        </div>
      </section>
    </>
  );
}
