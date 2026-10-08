"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { comparisonIcons } from "@/components/comparison-icons";
import { METRES_PER_PX, measureUp, scrollSentence } from "@/lib/scroll-comparison";

const PULL_MS = 900;
const ICON_MS = 200;

/**
 * Light-hearted footer line and tape measure: how far the visitor has
 * scrolled on this page. Client only, so nothing is in the server HTML (the
 * footer reserves the height). Shown from the first centimetre; the blade
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
  const visible = metres >= 0.005;
  const pulled = pulledOn === pathname;
  const settled = settledOn === pathname;

  useEffect(() => {
    const tape = tapeRef.current;
    if (!visible || pulled || !tape) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setPulledOn(pathname);
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

  const { target, progress } = measureUp(metres);
  // One text node, so an update replaces the text rather than shifting a later node along the line.
  const sentence = scrollSentence(metres);
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
