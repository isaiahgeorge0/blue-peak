"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCalendarEvent, type CalendarEventRow } from "@/app/admin/calendar/actions";
import { AdminDialog, fieldClass, fieldLabelClass } from "@/components/admin/dialog";
import { ChevronDownIcon } from "@/components/admin/icons";
import { safeAction } from "@/components/admin/safe-action";
import { TimePicker } from "@/components/admin/time-picker";
import { primaryButton, secondaryButton } from "@/components/admin/ui";
import { type RecurrenceValue, weekdayFromDateKey } from "@/lib/calendar-recurrence";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

type CalendarEventFormDialogProps = {
  open: boolean;
  onClose: () => void;
  prefill: CalendarEventFormPrefill;
  heading?: string;
  onCreated?: (event: CalendarEventRow) => void;
};

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

export function CalendarEventFormDialog({ open, onClose, prefill, heading = "New event", onCreated }: CalendarEventFormDialogProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(prefill.start_date);
  const [title, setTitle] = useState(prefill.title ?? "");
  const [startTime, setStartTime] = useState(prefill.start_time ?? "");
  const [endTime, setEndTime] = useState(prefill.end_time ?? "");
  const [notes, setNotes] = useState(prefill.notes ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(prefill.recurrence ?? "none");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([weekdayFromDateKey(prefill.start_date)]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const startKey = prefill.start_date || todayDateKey();
      setStartDate(startKey);
      setTitle(prefill.title ?? "");
      setStartTime(prefill.start_time ?? "");
      setEndTime(prefill.end_time ?? "");
      setNotes(prefill.notes ?? "");
      setRecurrence(prefill.recurrence ?? "none");
      setRecurrenceDays([weekdayFromDateKey(startKey)]);
      setRecurrenceEndDate("");
      setError(null);
    }
  }

  function toggleWeekday(day: number) {
    setRecurrenceDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await safeAction(() =>
        createCalendarEvent({
          title,
          notes,
          start_date: startDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          lead_id: prefill.lead_id,
          recurrence,
          recurrence_days_of_week: recurrence === "weekly" || recurrence === "biweekly" ? recurrenceDays : undefined,
          recurrence_end_date: recurrence !== "none" && recurrenceEndDate ? recurrenceEndDate : undefined,
        }),
      );

      if (!result.ok) {
        // The form stays open with everything entered, so nothing is lost.
        setError(result.error);
        return;
      }

      if ("event" in result && result.event) {
        onCreated?.(result.event);
      }
      onClose();
      router.refresh();
    });
  }

  const showDayPicker = recurrence === "weekly" || recurrence === "biweekly";
  const showRepeatUntil = recurrence !== "none";

  return (
    <AdminDialog open={open} onClose={onClose} title={heading} description={formatDayHeading(startDate)} busy={isPending}>
      <form onSubmit={handleCreate} className="space-y-4">
        <label className="block">
          <span className={fieldLabelClass}>Title</span>
          <input
            required
            data-autofocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={fieldClass}
            placeholder="Site visit, follow-up…"
          />
        </label>

        <label className="block">
          <span className={fieldLabelClass}>Date</span>
          <input
            type="date"
            required
            value={startDate}
            onChange={(event) => {
              const nextDate = event.target.value;
              setStartDate(nextDate);
              if ((recurrence === "weekly" || recurrence === "biweekly") && recurrenceDays.length === 0) {
                setRecurrenceDays([weekdayFromDateKey(nextDate)]);
              }
            }}
            className={fieldClass}
          />
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

        <label className="block">
          <span className={fieldLabelClass}>Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
              onChange={(event) => {
                const nextValue = event.target.value as RecurrenceValue;
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
              {WEEKDAY_LABELS.map((label, day) => {
                const selected = recurrenceDays.includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    aria-pressed={selected}
                    aria-label={WEEKDAY_NAMES[day]}
                    className={`h-11 rounded-lg border text-xs font-bold transition-colors ${
                      selected ? "border-frost bg-frost text-navy" : "border-admin-edge text-ink hover:border-peak-fleet"
                    }`}
                  >
                    {label}
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
              onChange={(event) => setRecurrenceEndDate(event.target.value)}
              className={fieldClass}
            />
            <span className="mt-1.5 block text-xs text-ink/80">
              Leave blank to keep repeating (shown up to 12 months from the start date).
            </span>
          </label>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-bold text-ridge-cyan">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isPending} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={isPending} className={primaryButton}>
            {isPending ? "Saving…" : "Save event"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
}
