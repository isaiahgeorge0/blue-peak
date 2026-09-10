"use client";

import { useState, type FormEvent } from "react";

type ServiceOption = {
  slug: string;
  name: string;
};

type ContactFormProps = {
  services: ServiceOption[];
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  service_type: string;
  message: string;
};

const fieldClassName =
  "mt-2 w-full rounded-md border border-off-white/15 bg-black px-4 py-3 text-sm text-off-white outline-none transition-colors placeholder:text-off-white/35 focus:border-baby-blue";

const labelClassName = "block text-sm font-medium text-off-white/85";

const quoteButtonClassName =
  "inline-flex items-center justify-center rounded-full bg-baby-blue px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export function ContactForm({ services }: ContactFormProps) {
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(
          data.error ??
            "Unable to submit your enquiry right now. Please try again later.",
        );
        return;
      }

      setIsSuccess(true);
    } catch {
      setSubmitError(
        "Unable to submit your enquiry right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg border border-baby-blue/30 bg-black px-6 py-10">
        <h2 className="font-serif text-3xl tracking-tight text-off-white">
          Thanks, we have your enquiry
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-off-white/75">
          We usually reply the same working day with next steps or a time to
          visit. If it is urgent, call us and mention you sent this form.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClassName}>
            Name <span className="text-baby-blue">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={fieldClassName}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="name-error" className="mt-2 text-sm text-baby-blue">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone" className={labelClassName}>
            Phone <span className="text-baby-blue">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className={fieldClassName}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
          />
          {fieldErrors.phone ? (
            <p id="phone-error" className="mt-2 text-sm text-baby-blue">
              {fieldErrors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="service_type" className={labelClassName}>
          Service
        </label>
        <select
          id="service_type"
          name="service_type"
          value={form.service_type}
          onChange={(event) => updateField("service_type", event.target.value)}
          className={fieldClassName}
        >
          <option value="">Select a service</option>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClassName}>
          Tell us about the job
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          className={`${fieldClassName} resize-y`}
          placeholder="What do you want doing, and roughly when?"
        />
      </div>

      {submitError ? (
        <p
          role="alert"
          className="rounded-md border border-baby-blue/40 bg-black px-4 py-3 text-sm text-off-white"
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
      </button>
    </form>
  );
}
