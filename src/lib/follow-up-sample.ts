import { ESTIMATOR_SERVICE_TYPE } from "./lead-limits.ts";

export type SampleKind = "contact" | "estimator";

/** Made-up leads for the admin preview and "Send test to me": one from the contact form, one from the estimator. */
export const SAMPLE_LEADS: Record<SampleKind, { name: string; serviceType: string; message: string | null }> = {
  contact: { name: "Sam Taylor", serviceType: "kitchen-renovations", message: null },
  estimator: {
    name: "Sam Taylor",
    serviceType: ESTIMATOR_SERVICE_TYPE,
    message: [
      "Site visit request from the quote calculator.",
      "Work: Rear extension, Kitchen or bathroom",
      "Size: Standard",
      "Finish: Quality",
      "Estimated from: £90,000",
      "Time on site: 13 to 15 weeks",
      "When would you like to start: Within 3 months",
    ].join("\n"),
  },
};

export const SAMPLE_LEAD = SAMPLE_LEADS.contact;

export function isSampleKind(value: unknown): value is SampleKind {
  return value === "contact" || value === "estimator";
}
