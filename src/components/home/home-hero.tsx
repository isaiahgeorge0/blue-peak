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
import {
  onPhotoSecondaryCtaClassName,
  primaryCtaClassName,
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
      className={`home-scroll-cue absolute right-4 bottom-4 z-10 flex h-9 items-center gap-2 rounded-full bg-peak-white pr-4 pl-3 text-xs font-bold tracking-[0.2em] text-ink uppercase shadow-lg shadow-navy/20 transition-opacity duration-300 ease-out sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-10 [@media(max-height:31.2499rem)]:hidden ${
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
 * Full-bleed hero, one screen tall, with the type set on the photo. The header
 * floats over it; on screens too short for the copy it grows to fit rather
 * than clipping it.
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
  const imageWillChange = useTransform(scrollYProgress, (progress) =>
    progress < 1 ? "transform" : "auto",
  );
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -40]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // The reduced-motion preference is unknown on the server, so the first render
  // has no inline transform; .home-hero-image holds the starting frame until then.
  const animate = mounted && !reduceMotion;
  const imageMotionStyle: MotionStyle | undefined = animate
    ? { scale: imageScale, y: imageY, willChange: imageWillChange }
    : undefined;
  const copyMotionStyle: MotionStyle | undefined = animate
    ? { y: copyY, opacity: copyOpacity }
    : undefined;

  return (
    <section
      ref={sectionRef}
      className="home-hero relative isolate flex min-h-svh overflow-hidden bg-navy lg:min-h-screen"
    >
      <div className="home-hero-media absolute inset-0">
        <motion.div
          className="home-hero-image absolute inset-0 origin-center"
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
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pt-[calc(var(--site-header-height)+1.5rem)] pb-[4.75rem] sm:pb-10 lg:pb-14 [@media(max-height:31.2499rem)]:pb-5">
        <motion.div className="home-hero-copy relative isolate max-w-3xl" style={copyMotionStyle}>
          <p className="home-hero-eyebrow text-xs font-bold tracking-[0.2em] text-white/85 uppercase">
            Building and renovation · Ipswich and Suffolk
          </p>
          <h1 className="home-hero-title mt-4 font-serif text-white">
            <span className="home-hero-line">
              <span>Everything</span>
            </span>{" "}
            <span className="home-hero-line">
              <span>under one roof.</span>
            </span>
          </h1>
          <p className="home-hero-lede mt-5 max-w-[34rem] text-lg leading-relaxed text-white/90 lg:text-xl [@media(max-height:31.2499rem)]:mt-3 [@media(max-height:31.2499rem)]:text-base">
            Kitchens, extensions, roofing and full refurbs across Ipswich and
            Suffolk. One team for every trade, and a written price before we
            start.
          </p>
          <div className="home-hero-actions mt-7 flex flex-wrap gap-3 sm:mt-8 [@media(max-height:31.2499rem)]:mt-4">
            <Link href="/contact" className={primaryCtaClassName}>
              <span className="cta-label">Get a quote</span>
            </Link>
            <Link href="/quote" className={onPhotoSecondaryCtaClassName}>
              Build an estimate
            </Link>
          </div>
        </motion.div>
      </div>

      <ScrollCue />
    </section>
  );
}
