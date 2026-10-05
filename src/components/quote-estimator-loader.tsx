"use client";

import Link from "next/link";
import { catchError } from "next/error";
import { primaryCtaClassName } from "@/components/cta-styles";
import { IsometricEstimator } from "@/components/isometric-estimator";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

/** Shown when WebGL is unavailable or the calculator bundle fails to load. */
function EstimatorUnavailable() {
  return (
    <div className="flex min-h-[60vh] max-w-2xl flex-col justify-center py-8">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">
        Quote calculator
      </p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight text-ink sm:text-4xl">
        The 3D calculator can&apos;t run on this device
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink/75">
        Tell us what you have in mind and we&apos;ll give you a proper written
        price, usually after a free site visit.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Link href="/contact" className={primaryCtaClassName}>
          Send an enquiry
        </Link>
        <a
          href={`tel:${sitePhoneTel}`}
          className="text-sm text-ink/75 transition-colors hover:text-accent"
        >
          Or call {sitePhoneDisplay}
        </a>
      </div>
    </div>
  );
}

const EstimatorErrorBoundary = catchError(function EstimatorErrorFallback() {
  return <EstimatorUnavailable />;
});

/** Wraps the estimator so a WebGL or bundle failure falls back to contact options. */
export function QuoteEstimatorLoader() {
  return (
    <EstimatorErrorBoundary>
      <IsometricEstimator />
    </EstimatorErrorBoundary>
  );
}
