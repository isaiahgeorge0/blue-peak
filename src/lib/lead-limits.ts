/**
 * Input caps shared by /api/leads and the lead forms' maxLength attributes.
 * Must stay in step with leads_field_lengths_check in the database.
 */
export const LEAD_FIELD_LIMITS = {
  name: 100,
  phone: 30,
  email: 254,
  postcode: 12,
  service_type: 60,
  message: 2000,
} as const;

/** Hidden form field that real visitors never fill in. */
export const LEAD_HONEYPOT_FIELD = "company";

/** Request body field carrying the Cloudflare Turnstile token. */
export const LEAD_TURNSTILE_FIELD = "turnstile_token";

/** Turnstile `action` names, checked server-side. */
export const TURNSTILE_ACTIONS = {
  contact: "contact",
  estimator: "estimator",
} as const;

/** `service_type` sent by the quote calculator's booking flow. */
export const ESTIMATOR_SERVICE_TYPE = "quote-calculator";
