import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { services } from "@/lib/content";

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
        <div>
          <h1 className="text-4xl tracking-tight text-off-white sm:text-5xl">
            Get a quote
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-off-white/75">
            Tell us what you are planning. We usually reply the same working day
            with a clear next step.
          </p>
          <div className="mt-8 space-y-3 text-sm text-off-white/70">
            <p>
              <span className="text-baby-blue">Phone</span>
              <br />
              <a href="tel:+441234567890" className="text-off-white">
                01234 567890
              </a>
            </p>
            <p>
              <span className="text-baby-blue">Email</span>
              <br />
              <a
                href="mailto:hello@bluepeaksolutions.com"
                className="text-off-white"
              >
                hello@bluepeaksolutions.com
              </a>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-off-white/10 bg-black px-6 py-8 sm:px-8">
          <ContactForm services={serviceOptions} />
        </div>
      </div>
    </div>
  );
}
