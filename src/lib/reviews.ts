/**
 * Customer reviews shown on the homepage.
 *
 * Every entry with `sample: true` is placeholder copy and must be replaced
 * with a real, attributable review before launch. Reviews originally left
 * for the founders' previous businesses must have `attribution` filled in.
 */
export type Review = {
  quote: string;
  name: string;
  /** Job and town, e.g. "Kitchen renovation · Ipswich". */
  detail: string;
  /** Landscape 4:3 photo in public/reviews/. */
  image: string;
  imageAlt: string;
  /** e.g. "Review left for Kyle's previous business". */
  attribution?: string;
  sample: boolean;
};

const sampleQuote =
  "This is where a customer's own words will go: what the job was, how it went, and whether they would recommend Blue Peak.";

export const reviews: Review[] = [
  {
    quote: sampleQuote,
    name: "Customer name",
    detail: "Kitchen renovation · Ipswich",
    image: "/reviews/review-1.jpg",
    imageAlt:
      "Utility room with blue-grey cabinets, an oak worktop and a washing machine",
    sample: true,
  },
  {
    quote: sampleQuote,
    name: "Customer name",
    detail: "Rear extension · Felixstowe",
    image: "/reviews/review-2.jpg",
    imageAlt:
      "Dining area in a rear extension with a roof lantern and sliding doors to the garden",
    sample: true,
  },
  {
    quote: sampleQuote,
    name: "Customer name",
    detail: "Bathroom renovation · Woodbridge",
    image: "/reviews/review-3.jpg",
    imageAlt:
      "Downstairs cloakroom with sage green panelling and a black and white tiled floor",
    sample: true,
  },
];
