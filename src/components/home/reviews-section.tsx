import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { reviews } from "@/lib/reviews";

/*
 * No Review or AggregateRating structured data on purpose. It can be added
 * once every entry is a real, attributable customer review.
 */
export function ReviewsSection() {
  const hasSamples = reviews.some((review) => review.sample);

  return (
    <section aria-labelledby="reviews-heading" className="bg-page">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <SectionHeading eyebrow="Reviews" id="reviews-heading">
          What customers say.
        </SectionHeading>
        {hasSamples ? (
          <p className="mt-4 text-sm text-ink/70">
            Sample layout. Customer reviews will be added before launch.
          </p>
        ) : null}

        <ul
          tabIndex={0}
          aria-label="Customer reviews"
          className="-mx-6 mt-11 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto overscroll-x-contain px-6 py-1 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((review) => (
            <li
              key={review.image}
              className="w-[min(78vw,340px)] shrink-0 snap-start md:w-auto"
            >
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-panel">
                  <Image
                    src={review.image}
                    alt={review.imageAlt}
                    fill
                    sizes="(max-width: 767px) 78vw, (max-width: 1152px) 33vw, 370px"
                    className="object-cover"
                  />
                  {review.sample ? (
                    <span className="absolute top-3 left-3 rounded-full bg-frost px-3 py-1 text-xs font-bold tracking-[0.2em] text-navy uppercase">
                      Sample
                    </span>
                  ) : null}
                </div>
                <blockquote className="mt-6 font-serif text-2xl leading-snug tracking-heading text-ink">
                  <p>&ldquo;{review.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="block font-semibold text-ink">
                    {review.name}
                  </span>
                  <span className="mt-1 block text-ink/70">{review.detail}</span>
                  {review.attribution ? (
                    <span className="mt-2 block text-ink/70">
                      {review.attribution}
                    </span>
                  ) : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
