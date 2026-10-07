"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/brand/brand-logo";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
} from "@/components/cta-styles";
import { useHomeMotionPreference } from "@/components/home/use-home-motion";

const subscribeNever = () => () => {};

/** False on the server and during hydration, true once mounted in the browser. */
function useHasMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * Bottom-right "Scroll" pill. Fades out once the page has scrolled 80px and
 * stays gone. The wheel dot only loops when motion is allowed.
 */
function ScrollCue() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (gone) return;
    const onScroll = () => {
      if (window.scrollY > 80) setGone(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [gone]);

  return (
    <div
      aria-hidden
      className={`home-scroll-cue absolute right-4 bottom-4 z-10 flex h-9 items-center gap-2 rounded-full bg-peak-white pr-4 pl-3 text-xs font-bold tracking-[0.2em] text-ink uppercase shadow-lg shadow-navy/20 transition-opacity duration-300 ease-out sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-10 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg viewBox="0 0 16 24" className="h-5 w-auto">
        <rect x="1" y="1" width="14" height="22" rx="7" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <circle className="scroll-cue-dot" cx="8" cy="7" r="1.75" fill="currentColor" />
      </svg>
      Scroll
    </div>
  );
}

/**
 * Full-bleed hero locked to one dynamic viewport height. The header floats
 * over it, so the first screen is exactly the hero.
 */
export function HomeHero() {
  const reduceMotion = useHomeMotionPreference();
  const mounted = useHasMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  // The reduced-motion preference is unknown on the server, so the first render
  // has no inline transform; .home-hero-image holds the starting frame until then.
  const imageMotionStyle: MotionStyle | undefined =
    mounted && !reduceMotion ? { scale: imageScale, y: imageY } : undefined;

  return (
    <section
      ref={sectionRef}
      className="home-hero relative isolate h-[100dvh] overflow-hidden bg-navy"
    >
      <div className="home-hero-media absolute inset-0">
        <motion.div
          className="home-hero-image absolute inset-0 origin-center will-change-transform"
          style={imageMotionStyle}
        >
          <Image
            src="/home/hero.jpg"
            alt="Builder sketching a floor plan on a roll of drawings"
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/25 to-navy/10"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-5 pb-6 pt-[calc(var(--site-header-height)+0.75rem)] sm:px-6 sm:pb-8 lg:items-end lg:pb-10">
        {/*
          Frosted glass: solid near-opaque fallback first, then blur where supported
          so content never sits on a fully transparent plate.
        */}
        <div className="home-frost-card home-hero-card w-full max-w-2xl rounded-2xl border border-white/60 p-6 shadow-2xl shadow-navy/25 sm:p-8 lg:p-10">
          <BrandMark className="h-10 w-auto text-brand sm:h-12" />
          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-accent uppercase">
            Building and renovation · Ipswich and Suffolk
          </p>
          <h1 className="mt-3 text-display-sm leading-display tracking-heading text-ink sm:text-5xl sm:tracking-display lg:text-6xl xl:text-7xl">
            Everything under one roof.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/80 lg:text-xl">
            Kitchens, extensions, roofing and full refurbs across Ipswich and
            Suffolk. One team for every trade, and a written price before we
            start.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            <Link href="/contact" className={primaryCtaClassName}>
              <span className="cta-label">Get a quote</span>
            </Link>
            <Link href="/quote" className={secondaryCtaClassName}>
              Build an estimate
            </Link>
          </div>
        </div>
      </div>

      <ScrollCue />
    </section>
  );
}
