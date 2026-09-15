import type { Metadata } from "next";
import Link from "next/link";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
} from "@/components/cta-styles";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { services } from "@/lib/content";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact",
    description:
      "Request a written quote for kitchen, bathroom, extension, or renovation work from Blue Peak Solutions.",
  };
}

export default function ContactPage() {
  const serviceOptions = services.map((service) => ({
    slug: service.slug,
    name: service.name,
  }));

  return (
    <div className="bg-charcoal">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:py-20">
        <Reveal>
          <div>
            <h1 className="text-4xl tracking-tight text-off-white sm:text-5xl">
              Get a quote
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-off-white/75">
              Tell us what you are planning. We usually reply the same working
              day with a clear next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#quote-form" className={primaryCtaClassName}>
                Get a quote
              </a>
              <Link href="/work" className={secondaryCtaClassName}>
                See our work
              </Link>
            </div>
            <div className="mt-8 space-y-3 text-sm text-off-white/70">
              <p>
                <span className="text-baby-blue">Phone</span>
                <br />
                <a
                  href={`tel:${sitePhoneTel}`}
                  className="text-off-white transition-colors hover:text-baby-blue"
                >
                  {sitePhoneDisplay}
                </a>
              </p>
              <p>
                <span className="text-baby-blue">Email</span>
                <br />
                <a
                  href="mailto:hello@bluepeaksolutions.com"
                  className="text-off-white transition-colors hover:text-baby-blue"
                >
                  hello@bluepeaksolutions.com
                </a>
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            id="quote-form"
            className="scroll-mt-28 rounded-lg border border-off-white/10 bg-black px-6 py-8 sm:px-8"
          >
            <ContactForm services={serviceOptions} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
