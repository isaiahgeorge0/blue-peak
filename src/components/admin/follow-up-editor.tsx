"use client";

import { useRouter } from "next/navigation";
import { useDeferredValue, useId, useMemo, useRef, useState, useTransition } from "react";
import { saveFollowUpStep, sendFollowUpTest, setFollowUpStepEnabled, type FollowUpDraft } from "@/app/admin/follow-ups/actions";
import { ChevronDownIcon, ClockIcon, SendIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { useToast } from "@/components/admin/toast";
import { Card, primaryButton, secondaryButton } from "@/components/admin/ui";
import { renderFollowUpEmail, templateProblems } from "@/lib/follow-up-email";
import { EMAIL_MARK_PNG_BASE64 } from "@/lib/follow-up-email-mark";
import { SAMPLE_LEAD } from "@/lib/follow-up-sample";
import { STEP_LABELS, type DelayUnit, type FollowUpSetting, type FollowUpStep } from "@/lib/follow-up-schedule";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const MARK_DATA_URL = `data:image/png;base64,${EMAIL_MARK_PNG_BASE64}`;
const DELAY_LIMITS: Record<DelayUnit, number> = { hours: 720, days: 90 };

function plural(amount: number, unit: DelayUnit) {
  const word = unit === "days" ? "day" : "hour";
  return `${amount} ${word}${amount === 1 ? "" : "s"}`;
}

/** When the step goes, in a sentence, from the delay being edited. */
function scheduleSentence(step: FollowUpStep, amount: number, unit: DelayUnit) {
  const after = amount === 0 ? "Straight after" : `${plural(amount, unit)} after`;
  switch (step) {
    case "acknowledgement":
      return amount === 0
        ? "Within a few minutes of a new enquiry, at any time of day, if the lead is still New."
        : `${after} a new enquiry, at any time of day, if the lead is still New.`;
    case "quote_chaser_1":
    case "quote_chaser_2":
      return `${after} a lead is marked Quoted, only if it's still Quoted. Any status change stops it.`;
    case "review_request":
      return `${after} a Won job is marked complete.`;
  }
}

const WINDOW_NOTE = "Sent between 8am and 7pm UK time, Monday to Saturday. Anything due outside those hours waits.";

type StepCardProps = {
  setting: FollowUpSetting;
  reviewUrl: string | null;
  adminEmail: string;
  canSend: boolean;
};

function Switch({ checked, labelledBy, disabled, onChange }: { checked: boolean; labelledBy: string; disabled: boolean; onChange: () => void }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden className="text-sm font-bold text-ink/80">
        {checked ? "On" : "Off"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelledBy}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-11 w-[4.25rem] shrink-0 items-center rounded-full border transition-colors duration-200 disabled:cursor-wait disabled:opacity-70 ${
          checked ? "border-transparent bg-brand ring-1 ring-inset ring-white/15" : "border-admin-edge bg-admin-base"
        }`}
      >
        <span
          aria-hidden
          className={`absolute left-1.5 size-8 rounded-full shadow transition-transform duration-200 ease-out motion-reduce:transition-none ${
            checked ? "translate-x-[1.5rem] bg-frost" : "translate-x-0 bg-admin-edge"
          }`}
        />
      </button>
    </span>
  );
}

function StepCard({ setting, reviewUrl, adminEmail, canSend }: StepCardProps) {
  const router = useRouter();
  const toast = useToast();
  const ids = { title: useId(), panel: useId(), delay: useId(), unit: useId(), subject: useId(), body: useId(), help: useId(), schedule: useId() };
  const label = STEP_LABELS[setting.step];
  const isReview = setting.step === "review_request";

  const saved: FollowUpDraft = useMemo(
    () => ({ delay_amount: setting.delay_amount, delay_unit: setting.delay_unit, subject: setting.subject, body: setting.body }),
    [setting],
  );
  const [synced, setSynced] = useState(saved);
  const [draft, setDraft] = useState<FollowUpDraft>(saved);
  const [delayText, setDelayText] = useState(String(saved.delay_amount));
  const [enabled, setEnabled] = useState(setting.enabled);
  const [syncedEnabled, setSyncedEnabled] = useState(setting.enabled);
  if (saved !== synced) {
    setSynced(saved);
    setDraft(saved);
    setDelayText(String(saved.delay_amount));
  }
  if (setting.enabled !== syncedEnabled) {
    setSyncedEnabled(setting.enabled);
    setEnabled(setting.enabled);
  }

  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [switchPending, startSwitch] = useTransition();
  const [savePending, startSave] = useTransition();
  const [testPending, startTest] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);

  const delayValid = /^\d+$/.test(delayText) && Number(delayText) <= DELAY_LIMITS[draft.delay_unit];
  const problems = [
    ...(delayValid ? [] : [`The delay must be a whole number from 0 to ${DELAY_LIMITS[draft.delay_unit]} ${draft.delay_unit}.`]),
    ...templateProblems(setting.step, draft.subject, draft.body),
  ];
  const dirty =
    draft.subject !== saved.subject || draft.body !== saved.body || draft.delay_unit !== saved.delay_unit || delayText !== String(saved.delay_amount);

  const shown = useDeferredValue(draft);
  const preview = useMemo(
    () =>
      renderFollowUpEmail({
        step: setting.step,
        subject: shown.subject,
        body: shown.body,
        name: SAMPLE_LEAD.name,
        serviceType: SAMPLE_LEAD.serviceType,
        phoneDisplay: sitePhoneDisplay,
        phoneHref: `tel:${sitePhoneTel}`,
        reviewUrl,
        stopUrl: "#",
        intendedRecipient: null,
        markSrc: MARK_DATA_URL,
      }),
    [setting.step, shown.subject, shown.body, reviewUrl],
  );

  function fitFrame() {
    const doc = frame.current?.contentDocument;
    const height = doc?.documentElement.scrollHeight ?? 0;
    if (frame.current && height > 0) frame.current.style.height = `${height}px`;
  }

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setMessage(null);
    startSwitch(async () => {
      const result = await safeAction(() => setFollowUpStepEnabled(setting.step, next));
      if (!result.ok) {
        setEnabled(!next);
        toast(`Couldn't save. ${label} is still ${next ? "off" : "on"}.`);
        return;
      }
      toast(`${label} turned ${next ? "on" : "off"}.`);
      router.refresh();
    });
  }

  function currentDraft(): FollowUpDraft {
    return { ...draft, delay_amount: Number(delayText) };
  }

  function save() {
    if (problems.length > 0) return;
    setMessage(null);
    startSave(async () => {
      const result = await safeAction(() => saveFollowUpStep(setting.step, currentDraft()));
      if (!result.ok) {
        setMessage({ tone: "error", text: `${result.error} Your changes are still here.` });
        return;
      }
      toast(`${label} saved.`);
      router.refresh();
    });
  }

  function sendTest() {
    if (problems.length > 0) return;
    setMessage(null);
    startTest(async () => {
      const result = await safeAction(() => sendFollowUpTest(setting.step, currentDraft()));
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({ tone: "info", text: `Test sent to ${adminEmail}, filled in for a made-up lead, ${SAMPLE_LEAD.name}.` });
      toast("Test email sent.");
    });
  }

  const fieldClass =
    "block w-full rounded-lg border border-admin-edge bg-admin-base px-4 text-[0.9375rem] text-ink placeholder:text-ink/60 hover:border-peak-fleet";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 py-5">
        <div className="min-w-0 flex-1">
          <h3 id={ids.title} className="font-serif text-[1.375rem] leading-tight font-normal tracking-heading text-ink">
            {label}
          </h3>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink/80">
            <ClockIcon className="mt-0.5 size-4 text-peak-fleet" />
            <span>{scheduleSentence(setting.step, saved.delay_amount, saved.delay_unit)}</span>
          </p>
          <p className="mt-1 text-sm break-words text-ink">
            <span className="text-ink/80">Subject: </span>
            {saved.subject}
          </p>
        </div>
        <Switch checked={enabled} labelledBy={ids.title} disabled={switchPending} onChange={toggle} />
      </div>

      <div className="border-t border-admin-line">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={ids.panel}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-5 text-left text-sm font-bold text-peak-fleet transition-colors hover:bg-admin-raised/60 hover:text-ridge-cyan"
        >
          <span>
            {open ? "Hide email" : "Edit email"}
            <span className="sr-only">: {label}</span>
          </span>
          <ChevronDownIcon className={`size-5 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div id={ids.panel} hidden={!open} className="border-t border-admin-line px-5 py-5">
        {open ? (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-6">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <fieldset>
              <legend className="admin-label">Send after</legend>
              <div className="mt-2 flex gap-2">
                <label htmlFor={ids.delay} className="sr-only">
                  Delay
                </label>
                <input
                  id={ids.delay}
                  inputMode="numeric"
                  value={delayText}
                  onChange={(event) => setDelayText(event.target.value.trim())}
                  aria-describedby={ids.schedule}
                  className={`${fieldClass} h-11 w-24`}
                />
                <label htmlFor={ids.unit} className="sr-only">
                  Unit
                </label>
                <select
                  id={ids.unit}
                  value={draft.delay_unit}
                  onChange={(event) => setDraft({ ...draft, delay_unit: event.target.value as DelayUnit })}
                  className={`${fieldClass} h-11 w-32 cursor-pointer`}
                >
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
              <p id={ids.schedule} className="mt-2 text-sm leading-relaxed text-ink/80">
                {delayValid ? scheduleSentence(setting.step, Number(delayText), draft.delay_unit) : null}
                {setting.step === "acknowledgement" ? null : ` ${WINDOW_NOTE}`}
              </p>
            </fieldset>

            <div>
              <label htmlFor={ids.subject} className="admin-label">
                Subject
              </label>
              <input
                id={ids.subject}
                value={draft.subject}
                maxLength={150}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
                className={`${fieldClass} mt-2 h-11`}
              />
            </div>

            <div>
              <label htmlFor={ids.body} className="admin-label">
                Email
              </label>
              <textarea
                id={ids.body}
                value={draft.body}
                maxLength={4000}
                rows={14}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                aria-describedby={ids.help}
                className={`${fieldClass} mt-2 resize-y py-3 leading-relaxed`}
              />
              <p id={ids.help} className="mt-2 text-sm leading-relaxed text-ink/80">
                Use {"{first_name}"}, {"{service}"} and {"{phone}"}
                {isReview ? <>, and {"{review_link}"} on a line of its own for the review button</> : null}. Leave a blank line between
                paragraphs; lines starting 1., 2., 3. become numbered steps. The sign-off and the stop link are added for you.
              </p>
            </div>

            {problems.length > 0 ? (
              <ul role="alert" className="space-y-1 text-sm font-bold text-ridge-cyan">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={savePending || !dirty || problems.length > 0} className={primaryButton}>
                {savePending ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={sendTest} disabled={testPending || !canSend || problems.length > 0} className={secondaryButton}>
                <SendIcon className="size-4" />
                {testPending ? "Sending…" : "Send test to me"}
              </button>
            </div>
            <p className="text-sm text-ink/80">
              {canSend ? `Tests go to ${adminEmail} only, using what's in the boxes above.` : "Tests can't be sent until FOLLOW_UP_FROM and FOLLOW_UP_REPLY_TO are set."}
            </p>
            {message ? (
              <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm font-bold ${message.tone === "error" ? "text-ridge-cyan" : "text-ink"}`}>
                {message.text}
              </p>
            ) : null}
          </form>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="admin-label">Preview</p>
              <div role="group" aria-label="Preview colours" className="inline-flex rounded-full border border-admin-edge p-1">
                {[
                  { value: false, text: "Light" },
                  { value: true, text: "Dark" },
                ].map((option) => (
                  <button
                    key={option.text}
                    type="button"
                    aria-pressed={dark === option.value}
                    onClick={() => setDark(option.value)}
                    className={`min-h-9 rounded-full px-4 text-sm font-bold transition-colors ${
                      dark === option.value ? "bg-frost text-navy" : "text-ink/80 hover:text-ink"
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-ink/80">
              As {SAMPLE_LEAD.name} would see it. Subject: <span className="text-ink">{preview.subject}</span>
            </p>
            {isReview && !reviewUrl ? (
              <p className="mt-2 text-sm text-ink/80">GOOGLE_REVIEW_URL isn&apos;t set, so the button goes nowhere here and review requests are skipped.</p>
            ) : null}
            <iframe
              ref={frame}
              title={`Preview of the ${label.toLowerCase()} email`}
              srcDoc={preview.html}
              sandbox="allow-same-origin"
              onLoad={fitFrame}
              style={{ colorScheme: dark ? "dark" : "light" }}
              className="mt-3 block h-[40rem] w-full rounded-lg border border-admin-line"
            />
          </div>
        </div>
        ) : null}
      </div>
    </Card>
  );
}

export function FollowUpEditor({
  settings,
  reviewUrl,
  adminEmail,
  canSend,
}: {
  settings: FollowUpSetting[];
  reviewUrl: string | null;
  adminEmail: string;
  canSend: boolean;
}) {
  return (
    <ol className="space-y-4">
      {settings.map((setting) => (
        <li key={setting.step}>
          <StepCard setting={setting} reviewUrl={reviewUrl} adminEmail={adminEmail} canSend={canSend} />
        </li>
      ))}
    </ol>
  );
}
