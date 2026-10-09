"use client";

import { useEffect, useRef } from "react";
import { BrandWordmark } from "@/components/brand/brand-logo";

/**
 * The name set across the foot of the page, tone on tone. The first time it
 * comes into view it rises a little into place, once. It is only held back
 * after mounting and while still off screen, so it never vanishes from view
 * and shows as it is without scripts.
 */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mark = ref.current;
    if (!mark) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top, bottom } = mark.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) return;
    mark.dataset.armed = "";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        mark.dataset.shown = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="footer-wordmark">
      <BrandWordmark
        title=""
        peakClassName="text-current"
        className="block h-auto w-full text-panel"
      />
    </div>
  );
}
