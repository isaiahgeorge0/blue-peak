"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const GROW_END = 0.55;
const COPY_START = 0.55;
const RADIUS_FROM = 22;
const RADIUS_TO = 4;
/** Resting inset — tight intentional frame, room to grow to full-bleed. */
const PAD_FROM_VMIN = 16;
const PAD_FROM = `${PAD_FROM_VMIN}vmin`;

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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll-pinned photo that grows from a padded inset card to edge-to-edge,
 * then reveals a bottom scrim and caption. Timing: growP 0–55%, textP 55–100%.
 */
export function PhotoGlide() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    const copy = copyRef.current;
    if (!wrapper || !panel || !scrim || !copy) return;

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

      const textP = easeInOut(mapRange(progress, COPY_START, 1));
      scrim.style.opacity = String(textP);
      copy.style.opacity = String(textP);
      copy.style.transform = `translateY(${(1 - textP) * 28}px)`;
    };

    if (prefersReducedMotion()) {
      applyProgress(1);
      return;
    }

    applyProgress(0);

    let raf = 0;
    let ticking = false;

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
      className="relative h-[220vh] bg-panel"
      aria-label="Scroll to expand a project photo"
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-panel">
        <div
          ref={panelRef}
          className="absolute overflow-hidden will-change-[inset,border-radius]"
          style={{
            inset: PAD_FROM,
            borderRadius: `${RADIUS_FROM}px`,
            boxShadow: "0 24px 64px rgba(14,34,64,0.28)",
          }}
        >
          <Image
            src="/home/before.jpg"
            alt="Kitchen mid-renovation with new units going in"
            fill
            sizes="100vw"
            className="object-cover"
            priority={false}
          />

          <div
            ref={scrimRef}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent"
            style={{ opacity: 0 }}
            aria-hidden
          />

          <div
            ref={copyRef}
            className="theme-photo absolute bottom-0 left-0 max-w-lg px-6 pb-8 pt-16 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14"
            style={{ opacity: 0, transform: "translateY(28px)" }}
          >
            <p className="text-xs font-medium tracking-wide text-accent uppercase">
              Week 3 · Ipswich
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Stripped back,{" "}
              <em className="text-accent italic">built</em> properly
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/80 sm:text-base">
              Bare plaster, new units, light pouring back in. This is the stage
              most builders go quiet - it&apos;s where we send you a photo update
              every Friday.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
