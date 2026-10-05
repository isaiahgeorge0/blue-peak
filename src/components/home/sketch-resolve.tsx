"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  SKETCH_RESOLVE_PATHS,
  SKETCH_RESOLVE_VIEWBOX,
} from "@/lib/sketch-resolve-paths";

const DRAW_START = 0;
const DRAW_END = 0.4;
const PHOTO_START = 0.47;
const PHOTO_END = 0.9;
/** Per-path draw window within drawP (overlap stagger from the updated prototype). */
const PATH_OVERLAP = 0.22;
const LINE_REST_OPACITY = 0.1;
const PHOTO_SCALE_FROM = 1.03;

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
 * Scroll-pinned sketch that draws itself, then dissolves into the project photo.
 * Timing mirrors the updated prototype (drawP 0–40%, photoP 47–90%, path overlap 0.22).
 */
export function SketchResolve() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const photoLayerRef = useRef<HTMLDivElement>(null);
  const lineLayerRef = useRef<SVGSVGElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const photoLayer = photoLayerRef.current;
    const lineLayer = lineLayerRef.current;
    const pct = pctRef.current;
    const bar = barRef.current;
    if (!wrapper || !panel || !photoLayer || !lineLayer || !pct || !bar) {
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
      pct.textContent = "100%";
      bar.style.transform = "scaleX(1)";
      return;
    }

    photoLayer.style.opacity = "0";
    lineLayer.style.opacity = "1";
    panel.style.transform = `scale(${PHOTO_SCALE_FROM})`;
    pct.textContent = "0%";
    bar.style.transform = "scaleX(0)";

    let raf = 0;
    let ticking = false;

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
      pct.textContent = `${Math.round(progress * 100)}%`;
      bar.style.transform = `scaleX(${progress})`;
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
    <div
      ref={wrapperRef}
      className="theme-brand relative h-[280vh] bg-page"
      aria-label="Scroll to watch a project sketch resolve into a photo"
    >
      <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center gap-4 overflow-hidden px-5 py-6 sm:gap-5 lg:flex-row lg:gap-8 lg:px-8 xl:gap-10">
        <aside className="w-full max-w-sm shrink-0 text-left lg:w-[min(22vw,240px)] lg:max-w-none">
          <p className="text-[11px] font-medium tracking-wide text-accent uppercase sm:text-xs">
            How we work
          </p>
          <h2 className="mt-1.5 font-serif text-xl leading-tight tracking-tight text-ink sm:mt-2 sm:text-2xl xl:text-3xl">
            Every job starts on paper
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:mt-3 sm:text-sm">
            We sketch the layout, cost it properly, and agree it with you in
            writing before anything gets stripped out.
          </p>
        </aside>

        <div
          ref={panelRef}
          className="sketch-resolve-panel relative aspect-[1100/1326] w-[min(68vw,260px)] max-h-[38vh] origin-center overflow-hidden border border-ink/25 will-change-transform sm:w-[min(60vw,340px)] sm:max-h-[46vh] lg:w-[min(28vw,420px)] lg:max-h-[62vh]"
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
              sizes="(max-width: 640px) 92vw, 420px"
              className="object-cover"
            />
          </div>

          <svg
            ref={lineLayerRef}
            viewBox={SKETCH_RESOLVE_VIEWBOX}
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

        <aside className="w-full max-w-sm shrink-0 text-left lg:w-[min(22vw,240px)] lg:max-w-none lg:text-right">
          <p className="text-[11px] font-medium tracking-wide text-accent uppercase sm:text-xs">
            Then it happens
          </p>
          <h2 className="mt-1.5 font-serif text-xl leading-tight tracking-tight text-ink sm:mt-2 sm:text-2xl xl:text-3xl">
            You get photos, not surprises
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink/70 sm:mt-3 sm:text-sm lg:ml-auto lg:max-w-[22ch]">
            We send a photo update every Friday so you always know exactly where
            the job&apos;s at.
          </p>
        </aside>

        <div
          ref={barRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent/80"
          style={{ transform: "scaleX(0)" }}
          aria-hidden
        />

        <span
          ref={pctRef}
          className="pointer-events-none absolute right-5 bottom-5 font-sans text-xs tracking-widest text-ink/70 tabular-nums sm:right-8 sm:bottom-8"
          aria-hidden
        >
          0%
        </span>
      </div>
    </div>
  );
}
