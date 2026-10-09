"use client";

import { useEffect, useRef } from "react";

/**
 * "What we stand for" on Blue Solution. When the band first comes into view
 * its three words rise out of their masks one after another, once. The words
 * are only hidden after mounting and while the band is still off screen, so
 * they never vanish from view and show as they are without scripts.
 */
export function StatementBand() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = ref.current;
    if (!band) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top, bottom } = band.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) return;
    band.dataset.armed = "";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        band.dataset.shown = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(band);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="theme-brand bg-page">
      <div
        ref={ref}
        className="statement mx-auto max-w-6xl px-6 py-24 text-center lg:py-36"
      >
        <p className="statement-eyebrow text-xs font-bold tracking-[0.2em] text-accent uppercase">
          What we stand for
        </p>
        <h2 className="mt-6 text-6xl leading-display tracking-display text-ink lg:text-7xl xl:text-8xl">
          <span className="statement-word">
            <span>Simple.</span>
          </span>{" "}
          <em className="statement-word">
            <span>Trusted.</span>
          </em>{" "}
          <span className="statement-word">
            <span>Different.</span>
          </span>
        </h2>
      </div>
    </section>
  );
}
