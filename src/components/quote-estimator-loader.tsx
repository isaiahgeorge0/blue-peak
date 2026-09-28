"use client";

import dynamic from "next/dynamic";

const IsometricEstimator = dynamic(
  () =>
    import("@/components/isometric-estimator").then(
      (mod) => mod.IsometricEstimator,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-16 text-sm text-off-white/60">
        Loading the quote calculator...
      </div>
    ),
  },
);

/** Client boundary so `next/dynamic` can disable SSR for the WebGL scene. */
export function QuoteEstimatorLoader() {
  return <IsometricEstimator />;
}
