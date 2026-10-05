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
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-ink/10 bg-page text-sm text-ink/70">
        Loading before and after...
      </div>
    ),
  },
);

/** Client boundary for the below-fold before and after slider (`ssr: false`). */
export function HomeMotionIslands() {
  return <BeforeAfterSlider />;
}
