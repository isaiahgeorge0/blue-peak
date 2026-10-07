"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LeadHoneypot } from "@/components/lead-honeypot";
import { useTurnstile } from "@/components/use-turnstile";
import {
  ESTIMATOR_SERVICE_TYPE,
  LEAD_FIELD_LIMITS,
  LEAD_HONEYPOT_FIELD,
  LEAD_TURNSTILE_FIELD,
  TURNSTILE_ACTIONS,
} from "@/lib/lead-limits";
import { sitePhoneDisplay } from "@/lib/site";
import {
  ESTIMATOR_FINISH_LABELS,
  ESTIMATOR_SIZE_LABELS,
  type EstimateSummary,
} from "@/lib/isometric-estimator-config";

type EstimatorBookingProps = {
  /** Read at submit time so the lead carries the latest selection. */
  getEstimate: () => EstimateSummary | null;
  /** Extra lines appended to the message, read at submit time. */
  getExtraLines?: () => string[];
  /** Inside the funnel: the form is shown straight away, with no Cancel. */
  embedded?: boolean;
  onSent?: () => void;
};

type Step = "closed" | "open" | "submitting" | "sent";

const SUBMIT_ERROR =
  "Unable to send your request right now. Please try again, or call us.";

const fieldClassName =
  "mt-1.5 w-full rounded-md border border-ink/20 bg-page px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40";

const buttonClassName =
  "inline-flex items-center justify-center rounded-[7px] bg-accent px-5 py-3 text-[13.5px] font-bold text-on-accent transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

function describeEstimate(
  estimate: EstimateSummary | null,
  extraLines: string[] = [],
) {
  const lines = ["Site visit request from the quote calculator."];
  if (!estimate) return [...lines, ...extraLines].join("\n");

  lines.push(
    `Work: ${estimate.work.length ? estimate.work.join(", ") : "Not selected"}`,
    `Size: ${ESTIMATOR_SIZE_LABELS[estimate.size]}`,
    `Finish: ${ESTIMATOR_FINISH_LABELS[estimate.finish]}`,
  );
  if (estimate.total !== null) {
    lines.push(`Estimated from: £${estimate.total.toLocaleString("en-GB")}`);
  }
  if (estimate.weeks) {
    lines.push(`Time on site: ${estimate.weeks}`);
  }
  return [...lines, ...extraLines].join("\n");
}

/**
 * Captures name + phone and posts to the same /api/leads pipeline as the
 * contact form. Success is only shown after the lead is stored.
 */
export function EstimatorBooking({
  getEstimate,
  getExtraLines,
  embedded = false,
  onSent,
}: EstimatorBookingProps) {
  const [step, setStep] = useState<Step>(embedded ? "open" : "closed");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  // Mounted in every step so the check runs before the form is even opened.
  const {
    attachContainer: attachTurnstile,
    enabled: turnstileEnabled,
    getToken: getTurnstileToken,
    reset: resetTurnstile,
  } = useTurnstile(TURNSTILE_ACTIONS.estimator);

  useEffect(() => {
    if (step === "open" && !embedded) nameRef.current?.focus();
  }, [step, embedded]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!phone.trim()) nextErrors.phone = "Please enter your phone number.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStep("submitting");
    try {
      const turnstileToken = await getTurnstileToken();
      if (turnstileEnabled && !turnstileToken) {
        setSubmitError(
          `We couldn't confirm this request came from a person. Please try again, or call us on ${sitePhoneDisplay}.`,
        );
        setStep("open");
        resetTurnstile();
        return;
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          service_type: ESTIMATOR_SERVICE_TYPE,
          message: describeEstimate(getEstimate(), getExtraLines?.()),
          [LEAD_HONEYPOT_FIELD]: honeypot,
          [LEAD_TURNSTILE_FIELD]: turnstileToken ?? "",
        }),
      });
      resetTurnstile();

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setSubmitError(data.error ?? SUBMIT_ERROR);
        setStep("open");
        return;
      }

      setStep("sent");
      onSent?.();
    } catch {
      setSubmitError(SUBMIT_ERROR);
      setStep("open");
      resetTurnstile();
    }
  }

  return (
    <>
      <div ref={attachTurnstile} />
      {renderStep()}
    </>
  );

  function renderStep() {
    if (step === "sent") {
      return (
        <p role="status" className="text-sm text-accent">
          Noted - we&apos;ll follow up to arrange a visit.
        </p>
      );
    }

    if (step === "closed") {
      return (
        <button
          type="button"
          className={buttonClassName}
          onClick={() => setStep("open")}
        >
          Choose a visit
        </button>
      );
    }

    const isSubmitting = step === "submitting";

    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <LeadHoneypot
          id="estimator-company"
          value={honeypot}
          onChange={setHoneypot}
        />
        <p className="text-sm text-ink/75">
          Leave your details and we&apos;ll call to book a free site visit.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="estimator-name"
              className="block text-xs font-medium text-ink/85"
            >
              Name <span className="text-accent">*</span>
            </label>
            <input
              ref={nameRef}
              id="estimator-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.name}
              className={fieldClassName}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={
                fieldErrors.name ? "estimator-name-error" : undefined
              }
            />
            {fieldErrors.name ? (
              <p
                id="estimator-name-error"
                className="mt-1.5 text-xs text-accent"
              >
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="estimator-phone"
              className="block text-xs font-medium text-ink/85"
            >
              Phone <span className="text-accent">*</span>
            </label>
            <input
              id="estimator-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.phone}
              className={fieldClassName}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={
                fieldErrors.phone ? "estimator-phone-error" : undefined
              }
            />
            {fieldErrors.phone ? (
              <p
                id="estimator-phone-error"
                className="mt-1.5 text-xs text-accent"
              >
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>
        </div>

        {submitError ? (
          <p
            role="alert"
            className="rounded-md border border-accent/40 bg-page px-3 py-2.5 text-sm text-ink"
          >
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className={buttonClassName}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Request a visit"}
          </button>
          {embedded ? null : (
            <button
              type="button"
              className="text-sm text-ink/70 underline-offset-2 hover:text-ink hover:underline"
              onClick={() => {
                setStep("closed");
                setSubmitError(null);
                setFieldErrors({});
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }
}
