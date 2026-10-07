"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** 1 CSS pixel is 1/96 inch: 0.2646mm. */
const METRES_PER_PX = 0.0002646;

/** Real measurements only. Value in metres; phrase for one, and for n of them. */
const comparisons: { metres: number; one: string; many: (n: string) => string }[] = [
  { metres: 0.215, one: "one brick laid lengthways", many: (n) => `${n} bricks laid lengthways` },
  { metres: 0.9, one: "a kitchen worktop's height", many: (n) => `${n} kitchen worktops stacked up` },
  { metres: 1.981, one: "a standard door", many: (n) => `${n} standard doors` },
  { metres: 2.4, one: "floor to ceiling in most homes", many: (n) => `${n} times floor to ceiling in most homes` },
  { metres: 3.9, one: "a scaffold board", many: (n) => `${n} scaffold boards` },
  { metres: 5, one: "the length of our van", many: (n) => `${n} lengths of our van` },
  { metres: 7.5, one: "the height of a two-storey house", many: (n) => `${n} two-storey houses stacked up` },
  { metres: 20, one: "a cricket pitch", many: (n) => `${n} cricket pitches` },
];

const numberWords = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

/**
 * The closest comparison, allowing whole multiples up to twelve. Each step up
 * in multiple costs a little, so a single item wins when it is nearly as close.
 */
function compare(metres: number) {
  let best = { score: Infinity, text: comparisons[0].one };
  for (const item of comparisons) {
    const count = Math.max(1, Math.min(12, Math.round(metres / item.metres)));
    const score = Math.abs(metres - count * item.metres) / metres + (count - 1) * 0.02;
    if (score < best.score) {
      best = { score, text: count === 1 ? item.one : item.many(numberWords[count]) };
    }
  }
  return best.text;
}

function formatDistance(metres: number) {
  if (metres < 1) return `${Math.round(metres * 100)} centimetres`;
  return `${metres.toFixed(1)} metres`;
}

/**
 * Light-hearted footer line: how far the visitor has scrolled on this page.
 * Client only, so nothing is in the server HTML (no layout shift, no hydration
 * mismatch, nothing without JavaScript). Shown once they have scrolled 10cm.
 */
export function ScrollDistance() {
  const pathname = usePathname();
  const [furthest, setFurthest] = useState({ path: "", px: 0 });

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      setFurthest((current) =>
        current.path !== pathname
          ? { path: pathname, px: y }
          : y > current.px
            ? { path: pathname, px: y }
            : current,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const metres = furthest.path === pathname ? furthest.px * METRES_PER_PX : 0;
  if (metres < 0.1) return null;

  return (
    <p aria-hidden className="text-sm text-ink/70">
      You&apos;ve scrolled {formatDistance(metres)} on this page. That&apos;s
      about {compare(metres)}.
    </p>
  );
}
