"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SectionHeading } from "@/components/home/section-heading";
import {
  SKETCH_RESOLVE_PATHS,
  SKETCH_RESOLVE_VIEWBOX,
} from "@/lib/sketch-resolve-paths";

/**
 * Fractions of the pinned travel (wrapper height minus one viewport). Each
 * stage starts at its bound; the drawing draws during stage 02 (with a short
 * hold on the finished lines), resolves into the photo during stage 03, and
 * stage 04 holds the finished photo until the section unpins.
 */
const STAGE_BOUNDS = [0.15, 0.45, 0.85];
const DRAW_START = 0.15;
const DRAW_END = 0.42;
const PHOTO_START = 0.45;
const PHOTO_END = 0.85;
const RAIL_END = 0.95;
/** Per-path draw window within drawP (overlap stagger from the updated prototype). */
const PATH_OVERLAP = 0.22;
const LINE_REST_OPACITY = 0.1;
const PHOTO_SCALE_FROM = 1.03;

const stages = [
  {
    title: "Enquire",
    body: "Tell us what you want doing and send a few photos. We will say quickly whether it is a job we can take on.",
  },
  {
    title: "Get a fixed quote",
    body: "We visit the property, measure up, and send a written price before any work is booked.",
    caption: "Every job starts on paper",
  },
  {
    title: "Book the work",
    body: "Agree a start date, we protect the house, and we stay on it until the job is finished.",
    caption: "You get photos, not surprises",
  },
  {
    title: "Handover",
    body: "We walk the finished job with you before we call it done.",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function mapRange(value: number, inMin: number, inMax: number) {
  if (inMax <= inMin) return 0;
  return clamp((value - inMin) / (inMax - inMin), 0, 1);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * How we work: one pinned section. The sketch draws itself and resolves into
 * the photo while four stages of a job step through beside it.
 */
export function SketchResolve() {
  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const photoLayerRef = useRef<HTMLDivElement>(null);
  const lineLayerRef = useRef<SVGSVGElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const photoLayer = photoLayerRef.current;
    const lineLayer = lineLayerRef.current;
    const rail = railRef.current;
    const stageItems = stageRefs.current;
    if (!wrapper || !panel || !photoLayer || !lineLayer || !rail) {
      return;
    }

    const paths = Array.from(lineLayer.querySelectorAll("path"));
    const lengths = paths.map((path) => {
      try {
        return path.getTotalLength();
      } catch {
        return 0;
      }
    });

    const reduceMotion = prefersReducedMotion();

    paths.forEach((path, index) => {
      const length = lengths[index] || 0;
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = reduceMotion ? "0" : `${length}`;
    });

    if (reduceMotion) {
      photoLayer.style.opacity = "1";
      lineLayer.style.opacity = String(LINE_REST_OPACITY);
      panel.style.transform = "scale(1)";
      rail.style.transform = "scaleY(1)";
      return;
    }

    photoLayer.style.opacity = "0";
    lineLayer.style.opacity = "1";
    panel.style.transform = `scale(${PHOTO_SCALE_FROM})`;

    let raf = 0;
    let ticking = false;
    let activeStage = -1;

    const applyProgress = (progress: number) => {
      const drawP = mapRange(progress, DRAW_START, DRAW_END);
      const n = paths.length;
      const pathDuration = n <= 1 ? 1 : PATH_OVERLAP;
      const startSpan = 1 - pathDuration;

      for (let index = 0; index < n; index += 1) {
        const length = lengths[index] || 0;
        const start = n <= 1 ? 0 : (index / (n - 1)) * startSpan;
        const local = easeOutCubic(
          mapRange(drawP, start, start + pathDuration),
        );
        paths[index].style.strokeDashoffset = `${length * (1 - local)}`;
      }

      const photoP = easeOutCubic(mapRange(progress, PHOTO_START, PHOTO_END));
      photoLayer.style.opacity = String(photoP);
      lineLayer.style.opacity = String(1 - photoP * (1 - LINE_REST_OPACITY));
      panel.style.transform = `scale(${PHOTO_SCALE_FROM - photoP * (PHOTO_SCALE_FROM - 1)})`;
      rail.style.transform = `scaleY(${mapRange(progress, 0, RAIL_END)})`;

      const stage = STAGE_BOUNDS.filter((bound) => progress >= bound).length;
      if (stage !== activeStage) {
        activeStage = stage;
        stageItems.forEach((item, index) => {
          item?.setAttribute("data-active", String(index === stage));
        });
      }
    };

    const measure = () => {
      const rect = wrapper.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      applyProgress(clamp(-rect.top / travel, 0, 1));
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      raf = window.requestAnimationFrame(() => {
        ticking = false;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      aria-labelledby="how-heading"
      className="theme-brand relative bg-page motion-safe:h-[220vh] motion-safe:lg:h-[240vh]"
    >
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-20 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-12 lg:py-28 xl:gap-16 motion-safe:sticky motion-safe:top-0 motion-safe:h-[100dvh] motion-safe:overflow-hidden motion-safe:pt-20 motion-safe:pb-6 motion-safe:lg:content-center motion-safe:lg:pt-20 motion-safe:lg:pb-12">
        <div className="max-lg:contents">
          <SectionHeading
            eyebrow="How we work"
            id="how-heading"
            className="order-1 shrink-0"
          >
            From first call to <em>final tidy-up</em>.
          </SectionHeading>

          <div className="relative order-3 mt-6 shrink-0 pl-6 lg:mt-10">
            <div
              className="absolute inset-y-0 left-0 w-0.5 overflow-hidden bg-ink/15"
              aria-hidden
            >
              <div
                ref={railRef}
                className="h-full w-full origin-top bg-accent"
                style={{ transform: "scaleY(0)" }}
              />
            </div>
            <ol className="grid lg:gap-6">
              {stages.map((stage, index) => (
                <li
                  key={stage.title}
                  ref={(node) => {
                    stageRefs.current[index] = node;
                  }}
                  data-active={index === 0 ? "true" : "false"}
                  className="group transition-opacity duration-500 ease-out motion-safe:max-lg:[grid-area:1/1] motion-safe:max-lg:opacity-0 motion-safe:max-lg:data-[active=true]:opacity-100 motion-safe:lg:opacity-70 motion-safe:lg:data-[active=true]:opacity-100 max-lg:motion-reduce:mt-8 max-lg:motion-reduce:first:mt-0"
                >
                  <h3 className="flex items-baseline gap-3 text-2xl leading-tight text-ink">
                    <span className="font-sans text-sm font-medium tracking-[0.2em] text-accent motion-safe:lg:text-ink motion-safe:lg:group-data-[active=true]:text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {stage.title}
                  </h3>
                  <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out motion-safe:lg:grid-rows-[0fr] motion-safe:lg:group-data-[active=true]:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p className="max-w-md pt-3 text-base leading-relaxed text-ink/80">
                        {stage.body}
                      </p>
                      {stage.caption ? (
                        <p className="pt-3 font-serif text-lg text-accent italic">
                          {stage.caption}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div
          ref={panelRef}
          className="sketch-resolve-panel relative order-2 mt-6 aspect-[1100/1326] w-full origin-center overflow-hidden border border-ink/25 will-change-transform lg:mt-0 lg:max-h-[calc(100dvh-10rem)] motion-safe:max-lg:aspect-auto motion-safe:max-lg:min-h-0 motion-safe:max-lg:flex-1"
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              backgroundColor: "var(--page)",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div
            ref={photoLayerRef}
            className="absolute inset-0 overflow-hidden"
            style={{ opacity: 0 }}
          >
            <Image
              src="/home/source.jpg"
              alt="Finished kitchen project"
              fill
              sizes="(max-width: 1023px) 92vw, 640px"
              className="object-cover"
            />
          </div>

          <svg
            ref={lineLayerRef}
            viewBox={SKETCH_RESOLVE_VIEWBOX}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden
            style={{ opacity: 1 }}
          >
            <g
              fill="none"
              stroke="var(--ink)"
              strokeWidth={1.15}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            >
              {SKETCH_RESOLVE_PATHS.map((d, index) => (
                <path key={index} d={d} />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
