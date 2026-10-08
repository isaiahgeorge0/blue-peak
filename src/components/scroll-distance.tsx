"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { comparisonIcons } from "@/components/comparison-icons";

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

const PULL_MS = 900;
const ICON_MS = 200;

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

/**
 * What the sentence and the tape both show. Below the last milestone the tape
 * runs from the previous milestone to the next one; from there on it stays
 * full and the sentence counts cricket pitches.
 */
function measureUp(metres: number) {
  const last = comparisons.length - 1;
  const pitch = comparisons[last];
  if (metres >= pitch.metres) {
    const count = Math.round(metres / pitch.metres);
    return {
      about: count === 1 ? pitch.one : pitch.many(numberWords[count] ?? String(count)),
      next: null,
      target: last,
      progress: 1,
    };
  }
  const target = comparisons.findIndex((item) => item.metres > metres);
  const from = target === 0 ? 0 : comparisons[target - 1].metres;
  const about = compare(metres);
  return {
    about,
    next: about === comparisons[target].one ? null : comparisons[target].one,
    target,
    progress: (metres - from) / (comparisons[target].metres - from),
  };
}

function formatDistance(metres: number) {
  if (metres < 1) return `${Math.round(metres * 100)} centimetres`;
  return `${metres.toFixed(1)} metres`;
}

/**
 * Light-hearted footer line and tape measure: how far the visitor has
 * scrolled on this page. Client only, so nothing is in the server HTML (the
 * footer reserves the height). Shown once they have scrolled 10cm; the blade
 * pulls out the first time it is in view on each page.
 */
export function ScrollDistance() {
  const pathname = usePathname();
  const [furthest, setFurthest] = useState({ path: "", px: 0 });
  const [pulledOn, setPulledOn] = useState("");
  const [settledOn, setSettledOn] = useState("");
  const tapeRef = useRef<HTMLDivElement>(null);

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
  const visible = metres >= 0.1;
  const pulled = pulledOn === pathname;
  const settled = settledOn === pathname;

  useEffect(() => {
    const tape = tapeRef.current;
    if (!visible || pulled || !tape) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPulledOn(pathname);
      },
      { threshold: 1 },
    );
    observer.observe(tape);
    return () => observer.disconnect();
  }, [visible, pulled, pathname]);

  useEffect(() => {
    if (!pulled || settled) return;
    const timer = window.setTimeout(() => setSettledOn(pathname), PULL_MS + ICON_MS);
    return () => window.clearTimeout(timer);
  }, [pulled, settled, pathname]);

  if (!visible) return null;

  const { about, next, target, progress } = measureUp(metres);
  // One text node, so an update replaces the text rather than shifting a later node along the line.
  const sentence = `You've scrolled ${formatDistance(metres)} on this page. That's about ${about}.${next ? ` Next up: ${next}.` : ""}`;
  const bladeStyle = {
    "--tape": pulled ? progress : 0,
    transitionDuration: settled ? "0ms" : `${PULL_MS}ms`,
  } as CSSProperties;

  return (
    <div aria-hidden>
      <p className="text-sm text-ink/70">{sentence}</p>
      <div ref={tapeRef} className="mt-2 flex h-6 items-start">
        <svg
          viewBox="0 0 20 20"
          className="mt-0.5 h-5 w-5 shrink-0 text-ink/70"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="0.75" y="0.75" width="18.5" height="18.5" rx="5" />
          <circle cx="10" cy="10" r="2.75" />
        </svg>
        <div className="relative mt-[0.8125rem] h-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-[2.5px] h-px bg-ink/15" />
          <div
            className="tape-blade absolute inset-0 ease-out"
            style={bladeStyle}
          />
        </div>
        <div className="relative ml-2 h-6 w-8 shrink-0 text-ink/80">
          {comparisonIcons.map((icon, index) => (
            <svg
              key={index}
              viewBox="0 0 32 24"
              className="absolute inset-0 h-6 w-8 transition-opacity duration-200 ease-out motion-reduce:transition-none"
              style={{
                opacity: pulled && index === target ? 1 : 0,
                transitionDelay: settled ? "0ms" : `${PULL_MS - 100}ms`,
              }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}
