"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { BrandMark } from "@/components/brand/brand-logo";
import { LeadHoneypot } from "@/components/lead-honeypot";
import { openerItem } from "@/components/page-opener";
import { ArrowIcon } from "@/components/section-heading";
import { useTurnstile } from "@/components/use-turnstile";
import {
  LEAD_FIELD_LIMITS,
  LEAD_HONEYPOT_FIELD,
  LEAD_TURNSTILE_FIELD,
  TURNSTILE_ACTIONS,
} from "@/lib/lead-limits";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

type ServiceOption = {
  slug: string;
  name: string;
};

type ContactFormProps = {
  services: ServiceOption[];
  /** Heading above the fields; it gives way with the form once it is sent. */
  title?: string;
  /** Shown under the form, and inside the confirmation once it is sent. */
  nextSteps?: ReactNode;
};

/** How long the sent form takes to give way to the confirmation. */
const LEAVE_MS = 250;
/** After the confirmation has scrolled into place and finished its entrance. */
const SETTLE_MS = 1200;

type FormState = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  service_type: string;
  message: string;
};

/* Hairline fields: the border holds 3:1 against the page, and focus turns it
   Blue Solution with a second ring inside. */
const fieldClassName =
  "mt-3 block min-h-13 w-full rounded-md border border-ink/48 bg-page px-4 py-3 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink/45 focus:border-accent focus:ring-1 focus:ring-accent";

const labelClassName = "block font-serif text-xl leading-tight text-ink";

const quoteButtonClassName =
  "group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-accent px-8 py-4 text-base font-bold text-on-accent transition-[background-color,opacity] duration-200 hover:bg-traverse focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent";

export function ContactForm({ services, title, nextSteps }: ContactFormProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    postcode: "",
    service_type: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Once the sent form has faded out, the confirmation takes its place.
  const [confirmed, setConfirmed] = useState(false);
  const [heldHeight, setHeldHeight] = useState<number | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const {
    attachContainer: attachTurnstile,
    enabled: turnstileEnabled,
    getToken: getTurnstileToken,
    reset: resetTurnstile,
  } = useTurnstile(TURNSTILE_ACTIONS.contact);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors: { name?: string; phone?: string } = {};
    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }
    if (!form.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const turnstileToken = await getTurnstileToken();
      if (turnstileEnabled && !turnstileToken) {
        setSubmitError(
          `We couldn't confirm this enquiry came from a person. Please try again, or call us on ${sitePhoneDisplay}.`,
        );
        return;
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          postcode: form.postcode.trim(),
          service_type: form.service_type,
          message: form.message.trim(),
          [LEAD_HONEYPOT_FIELD]: honeypot,
          [LEAD_TURNSTILE_FIELD]: turnstileToken ?? "",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setSubmitError(
          data.error ??
            "Unable to submit your enquiry right now. Please try again later.",
        );
        return;
      }

      // The block keeps its height as the form gives way, so nothing below moves.
      setHeldHeight(blockRef.current?.offsetHeight ?? null);
      setIsSuccess(true);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        setConfirmed(true);
      } else {
        window.setTimeout(() => setConfirmed(true), LEAVE_MS);
      }
      // The confirmation is shorter than the form. Its spare height is let go
      // only when the panel runs past the bottom of the screen, so everything
      // that moves up is out of view before and after.
      window.setTimeout(
        () => {
          const panel = blockRef.current?.firstElementChild;
          if (panel && panel.getBoundingClientRect().bottom >= window.innerHeight) {
            setHeldHeight(null);
          }
        },
        (reduceMotion ? 0 : LEAVE_MS) + SETTLE_MS,
      );
    } catch {
      setSubmitError(
        "Unable to submit your enquiry right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
      resetTurnstile();
    }
  }

  return (
    <div
      ref={blockRef}
      style={heldHeight ? ({ minHeight: heldHeight } as CSSProperties) : undefined}
    >
      {confirmed ? (
        <Confirmation nextSteps={nextSteps} />
      ) : (
        <div className={isSuccess ? "contact-leave" : undefined} inert={isSuccess}>
          {title ? (
            <h2 className="mb-10 font-serif text-[clamp(1.625rem,1.486rem+0.571vw,2rem)] leading-tight tracking-heading text-ink">
              {title}
            </h2>
          ) : null}
          {renderForm()}
          {nextSteps ? <div className="mt-16">{nextSteps}</div> : null}
        </div>
      )}
    </div>
  );

  function renderForm() {
    return (
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <LeadHoneypot id="contact-company" value={honeypot} onChange={setHoneypot} />
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClassName}>
              Name <span className="text-accent">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.name}
              className={fieldClassName}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p id="name-error" className="mt-2 text-sm text-accent">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone <span className="text-accent">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.phone}
              className={fieldClassName}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
            />
            {fieldErrors.phone ? (
              <p id="phone-error" className="mt-2 text-sm text-accent">
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.email}
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="postcode" className={labelClassName}>
              Postcode
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              autoComplete="postal-code"
              value={form.postcode}
              onChange={(event) => updateField("postcode", event.target.value)}
              maxLength={LEAD_FIELD_LIMITS.postcode}
              className={fieldClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="service_type" className={labelClassName}>
            Service
          </label>
          <div className="relative">
            <select
              id="service_type"
              name="service_type"
              value={form.service_type}
              onChange={(event) => updateField("service_type", event.target.value)}
              className={`${fieldClassName} appearance-none pr-12`}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.name}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute right-4 bottom-[1.625rem] size-4 translate-y-1/2 text-ink/70"
              aria-hidden
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.5 6l4.5 4.5L12.5 6"
              />
            </svg>
          </div>
        </div>

        <div>
          <label htmlFor="message" className={labelClassName}>
            Anything else we should know?
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            maxLength={LEAD_FIELD_LIMITS.message}
            className={`${fieldClassName} resize-y`}
            placeholder="What do you want doing, and roughly when?"
          />
        </div>

        <div ref={attachTurnstile} />

        {submitError ? (
          <p
            role="alert"
            className="rounded-md border border-accent/40 bg-page px-4 py-3 text-sm text-ink"
          >
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          className={quoteButtonClassName}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Get a quote"}
          <ArrowIcon />
        </button>
      </form>
    );
  }
}

/**
 * Takes the form's place once an enquiry is sent: the mark assembles, then
 * the confirmation, the next steps and the phone number rise in. Focus moves
 * to its heading so screen readers announce it.
 */
function Confirmation({ nextSteps }: { nextSteps?: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const heading = headingRef.current;
    if (!panel || !heading) return;
    heading.focus({ preventScroll: true });
    const { top, bottom } = heading.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      panel.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, []);

  return (
    <div
      ref={panelRef}
      className="contact-confirmation scroll-mt-[calc(var(--site-header-height)+1.5rem)]"
    >
      <BrandMark pieces title="" className="contact-mark h-14 w-auto text-accent" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="page-opener-item mt-8 text-4xl leading-tight tracking-heading text-ink outline-none lg:text-5xl"
        style={openerItem(300)}
      >
        Thanks, we have your enquiry.
      </h2>
      <p
        className="page-opener-item mt-4 max-w-xl text-lg leading-relaxed text-ink/75"
        style={openerItem(380)}
      >
        We usually reply the same working day with next steps or a time to
        visit. If it is urgent, call us and mention you sent this form.
      </p>
      {nextSteps ? (
        <div className="page-opener-item mt-12" style={openerItem(440)}>
          {nextSteps}
        </div>
      ) : null}
      <div className="page-opener-item mt-12" style={openerItem(500)}>
        <a
          href={`tel:${sitePhoneTel}`}
          className="link-draw tap-target font-serif text-4xl tracking-display text-ink lg:text-5xl"
        >
          {sitePhoneDisplay}
        </a>
      </div>
    </div>
  );
}
