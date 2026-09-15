import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, projects } from "@/lib/content";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found",
    };
  }

  return {
    title: `${project.title}, ${project.location}`,
    description: project.shortDescription,
  };
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <p className="text-sm tracking-wide text-baby-blue uppercase">Work</p>
      <h1 className="mt-3 text-4xl tracking-tight text-off-white sm:text-5xl">
        {project.title}, {project.location}
      </h1>
      {/* Project photo placeholder */}
      <div className="mt-8 aspect-video max-w-3xl bg-gray-800" />
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-off-white/75">
        {project.shortDescription}
      </p>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-off-white/70">
        {project.longDescription}
      </p>
      <div className="mt-10">
        <Link href="/contact" className={quoteButtonClassName}>
          Get a quote
        </Link>
      </div>
    </div>
  );
}
