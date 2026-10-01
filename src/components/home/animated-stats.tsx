"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useHomeMotionPreference } from "@/components/home/use-home-motion";

type StatDef = {
  value: number;
  suffix: string;
  label: string;
};

/*
 * Only add figures Blue Peak has confirmed (years trading, jobs completed).
 * The section renders nothing while this list is empty.
 */
const STATS: StatDef[] = [];

function StatCard({
  stat,
  index,
  reduceMotion,
}: {
  stat: StatDef;
  index: number;
  reduceMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    if (reduceMotion) {
      motionValue.set(stat.value);
      return;
    }
    const controls = animate(motionValue, stat.value, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, motionValue, reduceMotion, stat.value]);

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={
        inView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
      }
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-xl border border-off-white/10 bg-black/40 px-5 py-6"
    >
      <p className="font-serif text-3xl text-off-white sm:text-4xl">
        <span className="tabular-nums">{display}</span>
        {stat.suffix}
      </p>
      <p className="mt-2 text-sm text-off-white/65">{stat.label}</p>
    </motion.div>
  );
}

export function AnimatedStats() {
  const reduceMotion = useHomeMotionPreference();

  if (STATS.length === 0) return null;

  return (
    <section className="border-b border-off-white/10 bg-charcoal">
      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-3 sm:gap-6">
        {STATS.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
