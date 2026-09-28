import type { Metadata } from "next";
import { QuoteEstimatorLoader } from "@/components/quote-estimator-loader";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Quote calculator",
    description:
      "Interactive 3D estimate for loft conversions, extensions, and renovations with Blue Peak Solutions.",
  };
}

export default function QuotePage() {
  return (
    <section className="bg-black">
      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:py-16">
        <QuoteEstimatorLoader />
      </div>
    </section>
  );
}
