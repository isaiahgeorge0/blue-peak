import type { Metadata } from "next";
import { QuoteEstimatorLoader } from "@/components/quote-estimator-loader";
import { estimateCopyAvailable } from "@/lib/follow-ups";
import { pageMetadata } from "@/lib/page-metadata";

// Prerendered; the follow-up settings actions revalidate it, and env changes redeploy.
export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Build your estimate",
    description:
      "Interactive 3D estimate for loft conversions, extensions, and renovations with Blue Peak.",
    path: "/quote",
  });
}

export default async function QuotePage() {
  const offerEmailCopy = await estimateCopyAvailable();
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-6xl px-6 pt-30 pb-12 lg:pt-34 lg:pb-16">
        <QuoteEstimatorLoader offerEmailCopy={offerEmailCopy} />
      </div>
    </section>
  );
}
