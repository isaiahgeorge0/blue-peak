import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import { BrandMark } from "@/components/brand/brand-logo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Work",
    description:
      "Recent kitchen, extension, bathroom, and refurb projects from Blue Peak Solutions across Ipswich and Suffolk.",
    path: "/work",
  });
}

export default function WorkPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl tracking-tight text-ink sm:text-5xl">
        Work
      </h1>
      <p className="mt-4 max-w-2xl text-base text-ink/75">
        A sample of recent jobs. Each one was quoted in writing before we
        started.
      </p>
      <ul className="mt-12 grid gap-8 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.slug}>
            <Link href={`/work/${project.slug}`} className="group block">
              {/* Project photo placeholder */}
              <div className="aspect-video flex items-center justify-center bg-panel">
                <BrandMark title="" className="h-14 w-auto text-brand/15" />
              </div>
              <h2 className="mt-4 font-serif text-2xl text-ink group-hover:text-accent">
                {project.title}, {project.location}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {project.shortDescription}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
