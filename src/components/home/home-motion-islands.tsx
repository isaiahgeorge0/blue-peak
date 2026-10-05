"use client";

import dynamic from "next/dynamic";

const BeforeAfterSlider = dynamic(
  () =>
    import("@/components/home/before-after-slider").then(
      (mod) => mod.BeforeAfterSlider,
    ),
  {
    ssr: false,
    loading: () => (
      <section className="bg-page">
        <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-ink/70">
          Loading before and after...
        </div>
      </section>
    ),
  },
);

/** Client boundary for below-fold homepage motion islands (`ssr: false`). */
export function HomeMotionIslands() {
  return <BeforeAfterSlider />;
}
