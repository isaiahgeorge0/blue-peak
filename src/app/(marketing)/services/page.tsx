import type { Metadata } from "next";
import { ClosingBand } from "@/components/closing-band";
import { PageOpener } from "@/components/page-opener";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ServicesIndex } from "@/components/services-index";
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
      <PageOpener
        eyebrow="Services"
        title="Building and renovation, done by one team."
        lede="The jobs we take on most often. Every price is fixed in writing after a site visit."
        image={{
          src: "/work/mid-build.jpg",
          alt: "Room part-way through renovation, with fresh plaster and a half-boarded stud wall",
        }}
      />

      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <ServicesIndex
            services={services.map(
              ({ slug, name, shortDescription, image, imageAlt }) => ({
                slug,
                name,
                shortDescription,
                image,
                imageAlt,
              }),
            )}
          />
        </div>
      </section>

      <section className="bg-panel">
        <Reveal className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <SectionHeading eyebrow="How we price">
            A written price before any work starts.
          </SectionHeading>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:mt-16 lg:gap-12">
            {pricingSteps.map((step, index) => (
              <li key={step.title} className="border-t border-ink/15 pt-6">
                <p className="text-sm font-bold tracking-[0.2em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl leading-tight font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-lg leading-relaxed text-ink/70">
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
