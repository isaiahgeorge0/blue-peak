"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCalendarEvent,
  type CalendarEventRow,
} from "@/app/admin/calendar/actions";
import { TimePicker } from "@/components/admin/time-picker";
import {
  type RecurrenceValue,
  weekdayFromDateKey,
} from "@/lib/calendar-recurrence";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

export function CalendarEventFormDialog({
  open,
  onClose,
  prefill,
  heading = "New event",
  onCreated,
}: CalendarEventFormDialogProps) {
  const router = useRouter();
  const titleId = useId();
  const [startDate, setStartDate] = useState(prefill.start_date);
  const [title, setTitle] = useState(prefill.title ?? "");
  const [startTime, setStartTime] = useState(prefill.start_time ?? "");
  const [endTime, setEndTime] = useState(prefill.end_time ?? "");
  const [notes, setNotes] = useState(prefill.notes ?? "");
  const [recurrence, setRecurrence] = useState<RecurrenceValue>(
    prefill.recurrence ?? "none",
  );
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([
    weekdayFromDateKey(prefill.start_date),
  ]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  useEffect(() => {
    if (!open) return;
    const next = prefillRef.current;
    setStartDate(next.start_date || todayDateKey());
    setTitle(next.title ?? "");
    setStartTime(next.start_time ?? "");
    setEndTime(next.end_time ?? "");
    setNotes(next.notes ?? "");
    setRecurrence(next.recurrence ?? "none");
    setRecurrenceDays([
      weekdayFromDateKey(next.start_date || todayDateKey()),
    ]);
    setRecurrenceEndDate("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isPending, onClose]);

  if (!open) return null;

  function toggleWeekday(day: number) {
    setRecurrenceDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleClose() {
    if (isPending) return;
    onClose();
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCalendarEvent({
        title,
        notes,
        start_date: startDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        lead_id: prefill.lead_id,
        recurrence,
        recurrence_days_of_week:
          recurrence === "weekly" || recurrence === "biweekly"
            ? recurrenceDays
            : undefined,
        recurrence_end_date:
          recurrence !== "none" && recurrenceEndDate
            ? recurrenceEndDate
            : undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.event) {
        onCreated?.(result.event);
      }
      onClose();
      router.refresh();
    });
  }

  const showDayPicker = recurrence === "weekly" || recurrence === "biweekly";
  const showRepeatUntil = recurrence !== "none";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-off-white/15 bg-charcoal p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-serif text-xl tracking-tight text-off-white"
        >
          {heading}
        </h2>
        <p className="mt-1 text-sm text-off-white/55">
          {formatDayHeading(startDate)}
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs tracking-wide text-off-white/55 uppercase">
              Date
            </span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(event) => {
                const nextDate = event.target.value;
                setStartDate(nextDate);
                if (
                  (recurrence === "weekly" || recurrence === "biweekly") &&
                  recurrenceDays.length === 0
                ) {
                  setRecurrenceDays([weekdayFromDateKey(nextDate)]);
                }
              }}
              className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue [color-scheme:dark]"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wide text-off-white/55 uppercase">
              Title
            </span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue"
              placeholder="Site visit, follow-up..."
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs tracking-wide text-off-white/55 uppercase">
                Start time
              </span>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                aria-label="Start time"
                disabled={isPending}
              />
            </div>
            <div>
              <span className="text-xs tracking-wide text-off-white/55 uppercase">
                End time
              </span>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                aria-label="End time"
                disabled={isPending}
              />
            </div>
          </div>

          <label className="block">
            <span className="text-xs tracking-wide text-off-white/55 uppercase">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue"
              placeholder="Optional details"
            />
          </label>

          <label className="block">
            <span className="text-xs tracking-wide text-off-white/55 uppercase">
              Recurrence
            </span>
            <select
              value={recurrence}
              onChange={(event) => {
                const nextValue = event.target.value as RecurrenceValue;
                setRecurrence(nextValue);
                if (
                  (nextValue === "weekly" || nextValue === "biweekly") &&
                  recurrenceDays.length === 0
                ) {
                  setRecurrenceDays([weekdayFromDateKey(startDate)]);
                }
              }}
              className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue"
            >
              {RECURRENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {showDayPicker ? (
            <fieldset>
              <legend className="text-xs tracking-wide text-off-white/55 uppercase">
                Repeat on
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, day) => {
                  const selected = recurrenceDays.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      aria-pressed={selected}
                      className={[
                        "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                        selected
                          ? "border-baby-blue/50 bg-baby-blue/15 text-baby-blue"
                          : "border-off-white/15 text-off-white/65 hover:border-off-white/30",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {recurrence === "monthly" ? (
            <p className="text-xs text-off-white/50">
              Repeats on day {Number(startDate.slice(-2))} each month.
            </p>
          ) : null}

          {showRepeatUntil ? (
            <label className="block">
              <span className="text-xs tracking-wide text-off-white/55 uppercase">
                Repeat until
              </span>
              <input
                type="date"
                value={recurrenceEndDate}
                min={startDate}
                onChange={(event) => setRecurrenceEndDate(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue [color-scheme:dark]"
              />
              <span className="mt-1 block text-[11px] text-off-white/40">
                Leave blank to repeat indefinitely (shown up to 12 months from
                the start date).
              </span>
            </label>
          ) : null}

          {error ? <p className="text-sm text-baby-blue">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md border border-off-white/15 px-3 py-2 text-sm text-off-white/70 transition-colors hover:border-off-white/30 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md border border-baby-blue/40 bg-baby-blue/15 px-3 py-2 text-sm text-baby-blue transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
