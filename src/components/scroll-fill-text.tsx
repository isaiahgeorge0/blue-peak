"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  type MotionStyle,
} from "motion/react";
import { Fragment, useRef, type CSSProperties } from "react";
import { useHasMounted } from "@/components/page-opener";

/**
 * A paragraph that fills word by word in Blue Solution as it scrolls up the
 * screen, from when its top is 80% of the way down to when its bottom is 40%
 * of the way down. Screen readers get the text once, as it is. It shows fully
 * filled until mounted, and stays so with reduced motion.
 */
export function ScrollFillText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion() === true;
  const mounted = useHasMounted();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.4"],
  });
  const words = text.split(" ");

  return (
    <motion.p
      ref={ref}
      className={`scroll-fill relative ${className}`}
      style={
        {
          "--words": words.length,
          ...(mounted && !reduceMotion ? { "--fill": scrollYProgress } : {}),
        } as MotionStyle
      }
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className="text-ink/48">
        {text}
      </span>
      <span aria-hidden className="absolute inset-0 text-accent">
        {words.map((word, index) => (
          <Fragment key={index}>
            {index > 0 ? " " : null}
            <span
              className="scroll-fill-word"
              style={{ "--i": index } as CSSProperties}
            >
              {word}
            </span>
          </Fragment>
        ))}
      </span>
    </motion.p>
  );
}
