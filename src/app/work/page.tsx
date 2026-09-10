import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Work",
    description:
      "Recent kitchen, extension, bathroom, and refurb projects from Blue Peak Solutions across Ipswich and Suffolk.",
  };
}

export default function WorkPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-4xl tracking-tight text-off-white sm:text-5xl">
        Work
      </h1>
      <p className="mt-4 max-w-2xl text-base text-off-white/75">
        A sample of recent jobs. Each one was quoted in writing before we
        started.
      </p>
      <ul className="mt-12 grid gap-8 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.slug}>
            <Link href={`/work/${project.slug}`} className="group block">
              {/* Project photo placeholder */}
              <div className="aspect-video bg-gray-800" />
              <h2 className="mt-4 font-serif text-2xl text-off-white group-hover:text-baby-blue">
                {project.title}, {project.location}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-off-white/70">
                {project.shortDescription}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
