import type { Metadata } from "next";
import { QuoteEstimatorLoader } from "@/components/quote-estimator-loader";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Build your estimate",
    description:
      "Interactive 3D estimate for loft conversions, extensions, and renovations with Blue Peak Solutions.",
    path: "/quote",
  });
}

export default function QuotePage() {
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:py-16">
        <QuoteEstimatorLoader />
      </div>
    </section>
  );
}
