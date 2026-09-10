import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceAreaBySlug, serviceAreas } from "@/lib/content";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90";

export function generateStaticParams() {
  return serviceAreas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/areas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    return {
      title: "Area not found",
    };
  }

  return {
    title: `Building work in ${area.name}`,
    description: area.shortDescription,
  };
}

export default async function AreaDetailPage({
  params,
}: PageProps<"/areas/[slug]">) {
  const { slug } = await params;
  const area = getServiceAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <p className="text-sm tracking-wide text-baby-blue uppercase">
        Service area
      </p>
      <h1 className="mt-3 text-4xl tracking-tight text-off-white sm:text-5xl">
        Building work in {area.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-off-white/75">
        {area.shortDescription}
      </p>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-off-white/70">
        {area.longDescription}
      </p>
      <div className="mt-10">
        <Link href="/contact" className={quoteButtonClassName}>
          Get a quote
        </Link>
      </div>
    </div>
  );
}
