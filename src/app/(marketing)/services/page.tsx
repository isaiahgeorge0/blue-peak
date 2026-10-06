import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-logo";
import { ClosingBand } from "@/components/closing-band";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { ArrowIcon, SectionHeading } from "@/components/section-heading";
import { services } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Services",
    description:
      "Kitchen and bathroom renovations, extensions, conservatories, roofing, flooring, loft conversions, and general renovations from Blue Peak.",
    path: "/services",
  });
}

const pricingSteps = [
  {
    title: "Site visit",
    body: "We visit the property, look at the job and measure up.",
  },
  {
    title: "Written quote",
    body: "You get a fixed price in writing before any work is booked.",
  },
  {
    title: "One team",
    body: "The same team runs your job from the first visit to the final tidy-up.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Building and renovation, done by one team."
        lede="The jobs we take on most often. Every price is fixed in writing after a site visit."
      />

      <section className="bg-page">
        <ul className="mx-auto grid max-w-6xl gap-6 px-6 py-20 lg:grid-cols-2 lg:gap-8 lg:py-28">
          {services.map((service, index) => (
            <li key={service.slug}>
              <Reveal delay={(index % 2) * 0.08} className="h-full">
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink/10 bg-page transition-colors duration-200 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:min-h-56 sm:flex-row"
                >
                  <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-panel sm:aspect-auto sm:w-2/5">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.imageAlt ?? ""}
                        fill
                        sizes="(max-width: 639px) calc(100vw - 3rem), (max-width: 1023px) 40vw, 220px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BrandMark title="" className="h-14 w-auto text-brand/15" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6 lg:p-8">
                    <h2 className="text-2xl leading-tight text-ink">
                      {service.name}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">
                      {service.shortDescription}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-accent underline-offset-4 group-hover:underline">
                      Learn more
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-panel">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="How we price">
            A written price before any work starts.
          </SectionHeading>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
            {pricingSteps.map((step, index) => (
              <li key={step.title} className="border-t border-ink/15 pt-6">
                <p className="text-sm font-medium tracking-[0.2em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl leading-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <ClosingBand />
    </>
  );
}
