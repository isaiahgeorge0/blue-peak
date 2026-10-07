"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** Only wider screens with motion allowed get the pinned version. */
const PINNED_QUERY =
  "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

const GROW_END = 0.5;
const COPY_START = 0.45;
/** The copy settles before the end of the pin, so nothing is still moving as it unpins. */
const COPY_END = 0.85;
const RADIUS_FROM = 22;
const RADIUS_TO = 4;
/** Resting inset: tight intentional frame, room to grow to full-bleed. */
const PAD_FROM_VMIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function mapRange(value: number, inMin: number, inMax: number) {
  if (inMax <= inMin) return 0;
  return clamp((value - inMin) / (inMax - inMin), 0, 1);
}

/**
 * Mid-build photo with a short caption. Pinned, it grows from a padded inset
 * card to edge-to-edge, then the scrim and copy fade in; both finish before
 * the section unpins. On phones and with reduced motion it is a static
 * full-width photo with the copy over it.
 */
export function PhotoGlide() {
  const wrapperRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    const copy = copyRef.current;
    if (!wrapper || !panel || !scrim || !copy) return;

    const query = window.matchMedia(PINNED_QUERY);
    let raf = 0;
    let ticking = false;

    const padFromPx = () =>
      (PAD_FROM_VMIN / 100) * Math.min(window.innerWidth, window.innerHeight);

    const applyProgress = (progress: number) => {
      const growP = easeOutCubic(mapRange(progress, 0, GROW_END));
      const pad = (1 - growP) * padFromPx();
      const radius = RADIUS_FROM + (RADIUS_TO - RADIUS_FROM) * growP;

      panel.style.inset = `${pad}px`;
      panel.style.borderRadius = `${radius}px`;
      panel.style.boxShadow =
        growP < 0.98
          ? `0 ${24 * (1 - growP)}px ${64 * (1 - growP)}px rgba(14,34,64,${0.28 * (1 - growP)})`
          : "none";

      const textP = easeInOut(mapRange(progress, COPY_START, COPY_END));
      scrim.style.opacity = String(textP);
      copy.style.opacity = String(textP);
      copy.style.translate = `0 ${(1 - textP) * 28}px`;
    };

    const clearStyles = () => {
      for (const element of [panel, scrim, copy]) {
        element.removeAttribute("style");
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

    const stop = () => {
      window.cancelAnimationFrame(raf);
      ticking = false;
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      clearStyles();
    };

    const sync = () => {
      stop();
      if (!query.matches) return;
      measure();
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);
    };

    sync();
    query.addEventListener("change", sync);

    return () => {
      query.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      aria-labelledby="on-site-heading"
      className="relative bg-panel md:motion-safe:h-[180vh]"
    >
      <div className="md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-dvh md:motion-safe:overflow-hidden">
        <div
          ref={panelRef}
          className="relative h-[80svh] min-h-[32rem] overflow-hidden md:motion-safe:absolute md:motion-safe:inset-[16vmin] md:motion-safe:h-auto md:motion-safe:min-h-0 md:motion-safe:rounded-[22px] md:motion-safe:shadow-[0_24px_64px_rgba(14,34,64,0.28)] md:motion-safe:will-change-[inset,border-radius]"
        >
          <Image
            src="/work/mid-build.jpg"
            alt="Room part-way through renovation, with fresh plaster and a half-boarded stud wall"
            fill
            sizes="100vw"
            className="object-cover"
          />

          <div
            ref={scrimRef}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/85 via-black/45 to-transparent md:motion-safe:opacity-0"
            aria-hidden
          />

          <div
            ref={copyRef}
            className="theme-photo absolute bottom-0 left-0 max-w-lg px-6 pt-16 pb-8 sm:px-10 sm:pb-12 md:motion-safe:translate-y-7 md:motion-safe:opacity-0 lg:px-14 lg:pb-14"
          >
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
              While we&apos;re on site
            </p>
            <h2
              id="on-site-heading"
              className="mt-3 text-3xl leading-display tracking-heading text-ink sm:text-4xl lg:text-5xl lg:tracking-display"
            >
              Stripped back, <em className="text-accent italic">built</em>{" "}
              properly.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink/80 sm:text-lg">
              You get photos, not surprises.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
