import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, services } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-opacity hover:opacity-90";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service not found",
    };
  }

  return pageMetadata({
    title: service.name,
    description: service.shortDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <p className="text-sm tracking-wide text-accent uppercase">Services</p>
      <h1 className="mt-3 text-4xl tracking-tight text-ink sm:text-5xl">
        {service.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
        {service.shortDescription}
      </p>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">
        {service.longDescription}
      </p>
      <div className="mt-10">
        <Link href="/contact" className={quoteButtonClassName}>
          Get a quote
        </Link>
      </div>
    </div>
  );
}
