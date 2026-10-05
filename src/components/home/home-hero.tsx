"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { useRef } from "react";
import { BrandMark } from "@/components/brand/brand-logo";
import {
  primaryCtaClassName,
  secondaryCtaClassName,
} from "@/components/cta-styles";
import { useHomeMotionPreference } from "@/components/home/use-home-motion";

/**
 * Full-bleed hero locked to one dynamic viewport height.
 * Pulls under the sticky header so the first screen is exactly the hero.
 */
export function HomeHero() {
  const reduceMotion = useHomeMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const imageMotionStyle: MotionStyle | undefined = reduceMotion
    ? undefined
    : { scale: imageScale, y: imageY };

  return (
    <section
      ref={sectionRef}
      className="relative isolate -mt-[var(--site-header-height,4.5rem)] h-[100dvh] overflow-hidden bg-navy"
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 origin-center will-change-transform"
          style={imageMotionStyle}
        >
          <Image
            src="/home/hero.jpg"
            alt="Builder sketching a floor plan on a roll of drawings"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/25 to-navy/10"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center px-5 pb-6 pt-[calc(var(--site-header-height,4.5rem)+0.75rem)] sm:px-6 sm:pb-8 lg:items-end lg:pb-10">
        {/*
          Frosted glass: solid near-opaque fallback first, then blur where supported
          so content never sits on a fully transparent plate.
        */}
        <div className="home-frost-card w-full max-w-xl rounded-2xl border border-white/60 p-5 shadow-2xl shadow-navy/25 sm:p-7 lg:p-8">
          <BrandMark className="h-10 w-auto text-brand sm:h-12" />
          <h1 className="mt-4 max-w-lg text-2xl leading-tight tracking-tight text-ink sm:mt-4 sm:text-3xl lg:text-4xl xl:text-5xl">
            Building work you don&apos;t have to worry about
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/80 sm:mt-4 sm:text-base lg:text-lg">
            Kitchens, extensions, and refurbs across Ipswich and Suffolk, quoted
            in writing before we start.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
            <Link href="/quote" className={primaryCtaClassName}>
              Build an estimate
            </Link>
            <Link href="/contact" className={secondaryCtaClassName}>
              Get a quote
            </Link>
            <Link href="/work" className={secondaryCtaClassName}>
              See our work
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
