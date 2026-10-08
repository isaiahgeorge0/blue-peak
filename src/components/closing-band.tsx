import Image from "next/image";
import Link from "next/link";
import {
  brandBandPrimaryCtaClassName,
  textLinkClassName,
} from "@/components/cta-styles";
import { Reveal } from "@/components/reveal";
import { ArrowIcon, SectionHeading } from "@/components/section-heading";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
import { containerWide } from "@/lib/image-sizes";

/** Final band on a page: quote and call buttons, plus the estimator preview. */
export function ClosingBand() {
  return (
    <Reveal>
      <section className="theme-brand border-b border-white/15 bg-page">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div>
            <SectionHeading eyebrow="Next step">
              Ready to get a <em>price</em> on the job?
            </SectionHeading>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink/80">
              Tell us what you&apos;re planning. We usually reply the same
              working day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/contact" className={brandBandPrimaryCtaClassName}>
                <span className="cta-label">Get a quote</span>
              </Link>
              <a
                href={`tel:${sitePhoneTel}`}
                className="link-draw tap-target text-sm font-bold text-ink"
              >
                Call {sitePhoneDisplay}
              </a>
            </div>
          </div>
          <div>
            <Link
              href="/quote"
              className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-white/15"
            >
              <Image
                src="/home/quote-preview.jpg"
                alt="3D quote calculator preview"
                fill
                sizes={`${containerWide(540)}, (max-width: 1024px) 100vw, 540px`}
                className="object-cover"
              />
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <p className="text-sm text-ink/80">
                Or build a rough estimate in 3D
              </p>
              <Link href="/quote" className={textLinkClassName}>
                Open the calculator
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
