"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCalendarEvent, updateCalendarEvent, type CalendarEventRow } from "@/app/admin/calendar/actions";
import { AdminDialog, fieldClass, fieldLabelClass } from "@/components/admin/dialog";
import { ChevronDownIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { TimePicker } from "@/components/admin/time-picker";
import { primaryButton, secondaryButton } from "@/components/admin/ui";
import { type RecurrenceValue, weekdayFromDateKey } from "@/lib/calendar-recurrence";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Weeks start on Monday; the stored values stay 0 = Sunday … 6 = Saturday. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
] as const;

export type CalendarEventFormPrefill = {
  start_date: string;
  title?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
  lead_id?: string;
  recurrence?: RecurrenceValue;
};

export type LeadOption = { id: string; name: string };

function formatDayHeading(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function todayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type CalendarEventFormProps = {
  /** Editing this event (or series) when set; creating otherwise. */
  event?: CalendarEventRow;
  prefill?: CalendarEventFormPrefill;
  /** Shows a "Linked lead" choice. Without it the prefilled (or existing) lead is kept. */
  leads?: LeadOption[];
  onCancel: () => void;
  onSaved: (event: CalendarEventRow) => void;
  onBusyChange?: (busy: boolean) => void;
};

/** The event fields, for creating an event or editing one. Validation is the server's, shared by both. */
export function CalendarEventForm({ event, prefill, leads, onCancel, onSaved, onBusyChange }: CalendarEventFormProps) {
  const router = useRouter();
  const initialDate = event?.start_date ?? (prefill?.start_date || todayDateKey());
  const [startDate, setStartDate] = useState(initialDate);
  const [title, setTitle] = useState(event?.title ?? prefill?.title ?? "");
  const [startTime, setStartTime] = useState((event?.start_time ?? prefill?.start_time ?? "").slice(0, 5));
  const [endTime, setEndTime] = useState((event?.end_time ?? prefill?.end_time ?? "").slice(0, 5));
  const [notes, setNotes] = useState(event?.notes ?? prefill?.notes ?? "");
  const [leadId, setLeadId] = useState(event?.lead_id ?? prefill?.lead_id ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(
    (event?.recurrence as RecurrenceValue | undefined) ?? prefill?.recurrence ?? "none",
  );
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    event?.recurrence_days_of_week?.length ? event.recurrence_days_of_week : [weekdayFromDateKey(initialDate)],
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(event?.recurrence_end_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onBusyChange?.(isPending);
    return () => onBusyChange?.(false);
  }, [isPending, onBusyChange]);

  // A linked lead that's no longer in the list (spam, say) stays selectable.
  const leadOptions =
    leads && leadId && !leads.some((lead) => lead.id === leadId) ? [{ id: leadId, name: "Current lead" }, ...leads] : leads;

  function toggleWeekday(day: number) {
    setRecurrenceDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setError(null);

    const input = {
      title,
      notes,
      start_date: startDate,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      lead_id: leadId || undefined,
      recurrence,
      recurrence_days_of_week: recurrence === "weekly" || recurrence === "biweekly" ? recurrenceDays : undefined,
      recurrence_end_date: recurrence !== "none" && recurrenceEndDate ? recurrenceEndDate : undefined,
    };

    startTransition(async () => {
      const result = await safeAction(() => (event ? updateCalendarEvent(event.id, input) : createCalendarEvent(input)));

      if (!result.ok) {
        // The form stays open with everything entered, so nothing is lost.
        setError(result.error);
        return;
      }

      if ("event" in result && result.event) {
        onSaved(result.event);
      }
      router.refresh();
    });
  }

  const showDayPicker = recurrence === "weekly" || recurrence === "biweekly";
  const showRepeatUntil = recurrence !== "none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={fieldLabelClass}>Title</span>
        <input
          required
          data-autofocus
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          className={fieldClass}
          placeholder="Site visit, follow-up…"
        />
      </label>

      <label className="block">
        <span className={fieldLabelClass}>{recurrence === "none" ? "Date" : "First date"}</span>
        <input
          type="date"
          required
          value={startDate}
          onChange={(changeEvent) => {
            const nextDate = changeEvent.target.value;
            setStartDate(nextDate);
            if ((recurrence === "weekly" || recurrence === "biweekly") && recurrenceDays.length === 0) {
              setRecurrenceDays([weekdayFromDateKey(nextDate)]);
            }
          }}
          className={fieldClass}
        />
        {startDate ? <span className="mt-1.5 block text-xs text-ink/80">{formatDayHeading(startDate)}</span> : null}
      </label>

      <div className="grid gap-4 min-[400px]:grid-cols-2 min-[400px]:gap-3">
        <div>
          <span className={fieldLabelClass}>Starts</span>
          <TimePicker value={startTime} onChange={setStartTime} aria-label="Start time" disabled={isPending} />
        </div>
        <div>
          <span className={fieldLabelClass}>Ends</span>
          <TimePicker value={endTime} onChange={setEndTime} aria-label="End time" disabled={isPending} />
        </div>
      </div>

      {leadOptions ? (
        <label className="block">
          <span className={fieldLabelClass}>Linked lead</span>
          <span className="relative block">
            <select
              value={leadId}
              onChange={(changeEvent) => setLeadId(changeEvent.target.value)}
              className={`${fieldClass} cursor-pointer appearance-none pr-10`}
            >
              <option value="">No linked lead</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3.5 bottom-3.5 size-4" />
          </span>
        </label>
      ) : null}

      <label className="block">
        <span className={fieldLabelClass}>Notes</span>
        <textarea
          value={notes}
          onChange={(changeEvent) => setNotes(changeEvent.target.value)}
          rows={3}
          className={`${fieldClass} h-auto resize-y py-2.5`}
          placeholder="Optional details"
        />
      </label>

      <label className="block">
        <span className={fieldLabelClass}>Repeats</span>
        <span className="relative block">
          <select
            value={recurrence}
            onChange={(changeEvent) => {
              const nextValue = changeEvent.target.value as RecurrenceValue;
              setRecurrence(nextValue);
              if ((nextValue === "weekly" || nextValue === "biweekly") && recurrenceDays.length === 0) {
                setRecurrenceDays([weekdayFromDateKey(startDate)]);
              }
            }}
            className={`${fieldClass} cursor-pointer appearance-none pr-10`}
          >
            {RECURRENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3.5 bottom-3.5 size-4" />
        </span>
      </label>

      {showDayPicker ? (
        <fieldset>
          <legend className={fieldLabelClass}>Repeat on</legend>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {WEEKDAY_ORDER.map((day) => {
              const selected = recurrenceDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  aria-pressed={selected}
                  aria-label={WEEKDAY_NAMES[day]}
                  className={`h-11 rounded-lg border text-xs font-bold transition-colors ${
                    selected ? "border-frost bg-frost text-navy" : "border-admin-edge text-ink hover:border-peak-fleet"
                  }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {recurrence === "monthly" ? <p className="text-sm text-ink/80">Repeats on day {Number(startDate.slice(-2))} each month.</p> : null}

      {showRepeatUntil ? (
        <label className="block">
          <span className={fieldLabelClass}>Repeat until</span>
          <input
            type="date"
            value={recurrenceEndDate}
            min={startDate}
            onChange={(changeEvent) => setRecurrenceEndDate(changeEvent.target.value)}
            className={fieldClass}
          />
          <span className="mt-1.5 block text-xs text-ink/80">
            Leave blank to keep repeating (shown up to 12 months from the start date).
          </span>
        </label>
      ) : null}

      {event && event.recurrence !== "none" ? (
        <p className="text-sm text-ink/80">Changes apply to every day in the series.</p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-bold text-ridge-cyan">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isPending} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" disabled={isPending} className={primaryButton}>
          {isPending ? "Saving…" : event ? "Save changes" : "Save event"}
        </button>
      </div>
    </form>
  );
}

type CalendarEventFormDialogProps = {
  open: boolean;
  onClose: () => void;
  prefill: CalendarEventFormPrefill;
  leads?: LeadOption[];
  heading?: string;
  onCreated?: (event: CalendarEventRow) => void;
};

/** "New event" in a dialog. The form remounts on every open, so it always starts from the prefill. */
export function CalendarEventFormDialog({ open, onClose, prefill, leads, heading = "New event", onCreated }: CalendarEventFormDialogProps) {
  const [busy, setBusy] = useState(false);
  return (
    <AdminDialog open={open} onClose={onClose} title={heading} busy={busy}>
      <CalendarEventForm
        prefill={prefill}
        leads={leads}
        onCancel={onClose}
        onBusyChange={setBusy}
        onSaved={(event) => {
          onCreated?.(event);
          onClose();
        }}
      />
    </AdminDialog>
  );
}
