"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  useRef,
  useSyncExternalStore,
  type FocusEvent,
  type RefObject,
} from "react";
import { onPhotoSecondaryCtaClassName } from "@/components/cta-styles";
import { SampleTag } from "@/components/sample-tag";
import { PINNABLE_QUERY } from "@/lib/pinnable";

export type PanelProject = {
  slug: string;
  title: string;
  location: string;
  shortDescription: string;
  image: string;
  imageAlt: string;
  sample: boolean;
  services: { slug: string; name: string }[];
};

/** How far a panel shrinks, and how dark it gets, as the next one covers it. */
const COVERED_SCALE = 0.94;
const COVERED_DIM = 0.3;

function subscribeStack(onChange: () => void) {
  const query = window.matchMedia(PINNABLE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** False on the server and during hydration, so the first render matches. */
function useStacking() {
  return useSyncExternalStore(
    subscribeStack,
    () => window.matchMedia(PINNABLE_QUERY).matches,
    () => false,
  );
}

/**
 * One full-screen panel per project. With motion allowed and room to pin,
 * each panel sticks to the top and the next slides up over it, while the
 * covered one shrinks slightly and darkens. With reduced motion or on short
 * screens they are plain panels one after another. Focusing anything in a
 * covered panel scrolls back to that panel, so focus is never hidden.
 */
export function WorkPanels({ projects }: { projects: PanelProject[] }) {
  const stackRef = useRef<HTMLDivElement>(null);
  const stacking = useStacking();
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={stackRef} className="relative bg-navy">
      {projects.map((project, index) => (
        <WorkPanel
          key={project.slug}
          project={project}
          index={index}
          count={projects.length}
          progress={scrollYProgress}
          stacking={stacking}
          stackRef={stackRef}
        />
      ))}
    </div>
  );
}

type WorkPanelProps = {
  project: PanelProject;
  index: number;
  count: number;
  progress: MotionValue<number>;
  stacking: boolean;
  stackRef: RefObject<HTMLDivElement | null>;
};

function WorkPanel({
  project,
  index,
  count,
  progress,
  stacking,
  stackRef,
}: WorkPanelProps) {
  const covered: [number, number] = [
    index / Math.max(1, count - 1),
    (index + 1) / Math.max(1, count - 1),
  ];
  const scale = useTransform(progress, covered, [1, COVERED_SCALE]);
  const dim = useTransform(progress, covered, [0, COVERED_DIM]);
  const shrinks = stacking && index < count - 1;
  const headingId = `work-panel-${project.slug}`;

  const revealOnFocus = (event: FocusEvent<HTMLElement>) => {
    const stack = stackRef.current;
    if (!stacking || !stack) return;
    const panel = event.currentTarget;
    const top =
      stack.getBoundingClientRect().top +
      window.scrollY +
      index * panel.offsetHeight;
    if (Math.abs(window.scrollY - top) > 1) {
      window.scrollTo({ top, behavior: "instant" });
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className={`work-panel relative min-h-svh overflow-hidden ${stacking ? "sticky top-0" : ""}`}
      onFocus={revealOnFocus}
    >
      <motion.div
        className="relative flex min-h-svh origin-top"
        style={shrinks ? { scale } : undefined}
      >
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-aspect-ratio: 16/9) calc(100vh * 16 / 9), 100vw"
          className="object-cover"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6 pt-[calc(var(--site-header-height)+2rem)] pb-10 sm:pb-12 lg:pb-16">
          <div className="work-panel-copy relative isolate min-w-0 max-w-3xl">
            {project.sample ? <SampleTag /> : null}
            <h2
              id={headingId}
              className="work-panel-title mt-4 text-white"
            >
              <Link
                href={`/work/${project.slug}`}
                className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {project.title}, {project.location}
              </Link>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {project.shortDescription}
            </p>
            {project.services.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-white">
                {project.services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="link-draw tap-target"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6">
              <Link
                href={`/work/${project.slug}`}
                className={onPhotoSecondaryCtaClassName}
                aria-describedby={headingId}
              >
                See the job
              </Link>
            </div>
          </div>
          <p
            aria-hidden
            className="relative shrink-0 text-xs font-bold tracking-[0.2em] text-white/85 tabular-nums"
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </p>
        </div>
      </motion.div>

      {shrinks ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 bg-navy"
          style={{ opacity: dim }}
        />
      ) : null}
    </section>
  );
}
