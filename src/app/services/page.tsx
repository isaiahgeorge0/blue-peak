import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Services",
    description:
      "Kitchen and bathroom renovations, extensions, conservatories, roofing, flooring, loft conversions, and general renovations from Blue Peak Solutions.",
  };
}

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl tracking-tight text-off-white sm:text-5xl">
        Services
      </h1>
      <p className="mt-4 max-w-2xl text-base text-off-white/75">
        The jobs we take on most often. Every price is fixed in writing after a
        site visit.
      </p>
      <ul className="mt-12 grid gap-8 sm:grid-cols-2">
        {services.map((service) => (
          <li key={service.slug}>
            <Link href={`/services/${service.slug}`} className="group block">
              <h2 className="font-serif text-2xl text-off-white group-hover:text-baby-blue">
                {service.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-off-white/70">
                {service.shortDescription}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
