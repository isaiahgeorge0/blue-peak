"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventRow,
} from "@/app/admin/calendar/actions";
import { TimePicker } from "@/components/admin/time-picker";
import {
  expandEventsForRange,
  groupOccurrencesByDate,
  recurrenceLabel,
  type CalendarOccurrence,
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

type AdminCalendarProps = {
  year: number;
  month: number;
  rangeStart: string;
  rangeEnd: string;
  events: CalendarEventRow[];
};

type ModalState =
  | { type: "create"; date: string }
  | { type: "view"; occurrence: CalendarOccurrence }
  | null;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

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

function formatTime(value: string | null) {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[1]}:${match[2]}`;
}

function adjacentMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function monthHref(year: number, month: number) {
  return `/admin/calendar?year=${year}&month=${month}`;
}

function buildMonthCells(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<{
    key: string;
    day: number;
    inMonth: boolean;
    dateKey: string;
  }> = [];

  const prev = adjacentMonth(year, month, -1);
  const daysInPrev = new Date(prev.year, prev.month, 0).getDate();

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    cells.push({
      key: `prev-${day}`,
      day,
      inMonth: false,
      dateKey: toDateKey(prev.year, prev.month, day),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `cur-${day}`,
      day,
      inMonth: true,
      dateKey: toDateKey(year, month, day),
    });
  }

  const next = adjacentMonth(year, month, 1);
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${nextDay}`,
      day: nextDay,
      inMonth: false,
      dateKey: toDateKey(next.year, next.month, nextDay),
    });
    nextDay += 1;
  }

  return cells;
}

function RepeatIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0 text-baby-blue"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M2.5 3.5h7.2a3.3 3.3 0 0 1 0 6.6H8.2v-1.5h1.5a1.8 1.8 0 1 0 0-3.6H2.5L4.2 6.7 3.1 7.8 0 4.7l3.1-3.1 1.1 1.1L2.5 3.5Zm11 9H6.3a3.3 3.3 0 0 1 0-6.6h1.5v1.5H6.3a1.8 1.8 0 1 0 0 3.6h7.2l-1.7-1.7 1.1-1.1L16 11.3l-3.1 3.1-1.1-1.1 1.7-1.8Z"
      />
    </svg>
  );
}

export function AdminCalendar({
  year,
  month,
  rangeStart,
  rangeEnd,
  events,
}: AdminCalendarProps) {
  const router = useRouter();
  const titleId = useId();
  const [modal, setModal] = useState<ModalState>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrence, setRecurrence] = useState<RecurrenceValue>("none");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prev = adjacentMonth(year, month, -1);
  const next = adjacentMonth(year, month, 1);
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const occurrences = expandEventsForRange(events, rangeStart, rangeEnd);
    return groupOccurrencesByDate(occurrences);
  }, [events, rangeStart, rangeEnd]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  useEffect(() => {
    if (!modal) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModal(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  function openCreate(dateKey: string) {
    setTitle("");
    setStartTime("");
    setEndTime("");
    setNotes("");
    setRecurrence("none");
    setRecurrenceDays([weekdayFromDateKey(dateKey)]);
    setRecurrenceEndDate("");
    setError(null);
    setModal({ type: "create", date: dateKey });
  }

  function openView(occurrence: CalendarOccurrence) {
    setError(null);
    setModal({ type: "view", occurrence });
  }

  function closeModal() {
    if (isPending) return;
    setModal(null);
    setError(null);
  }

  function toggleWeekday(day: number) {
    setRecurrenceDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!modal || modal.type !== "create") return;

    setError(null);
    startTransition(async () => {
      const result = await createCalendarEvent({
        title,
        notes,
        start_date: modal.date,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
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

      setModal(null);
      router.refresh();
    });
  }

  function handleDelete(eventRow: CalendarEventRow) {
    const isRecurring = eventRow.recurrence !== "none";
    const confirmed = window.confirm(
      isRecurring
        ? "Delete this entire recurring series? Individual occurrences cannot be removed separately yet."
        : "Delete this event?",
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteCalendarEvent(eventRow.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setModal(null);
      router.refresh();
    });
  }

  const showDayPicker =
    recurrence === "weekly" || recurrence === "biweekly";
  const showRepeatUntil = recurrence !== "none";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight text-off-white sm:text-4xl">
            Calendar
          </h1>
          <p className="mt-3 text-sm text-off-white/70">
            Internal planning view. Recurring events expand across the month
            without duplicating rows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={monthHref(prev.year, prev.month)}
            className="rounded-md border border-off-white/15 px-3 py-2 text-sm text-off-white/75 transition-colors hover:border-baby-blue hover:text-baby-blue"
            aria-label="Previous month"
          >
            Prev
          </Link>
          <p className="min-w-40 text-center font-serif text-lg text-off-white">
            {formatMonthLabel(year, month)}
          </p>
          <Link
            href={monthHref(next.year, next.month)}
            className="rounded-md border border-off-white/15 px-3 py-2 text-sm text-off-white/75 transition-colors hover:border-baby-blue hover:text-baby-blue"
            aria-label="Next month"
          >
            Next
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-off-white/10 bg-black">
        <div className="grid grid-cols-7 border-b border-off-white/10">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-[11px] tracking-wide text-off-white/45 uppercase"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={cell.key}
                className={[
                  "relative min-h-28 border-r border-b border-off-white/10 p-2 last:border-r-0",
                  cell.inMonth ? "bg-black" : "bg-charcoal/40",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => openCreate(cell.dateKey)}
                  aria-label={`Add event on ${formatDayHeading(cell.dateKey)}`}
                  className="absolute inset-0 z-0 transition-colors hover:bg-off-white/5 focus-visible:bg-off-white/5 focus-visible:outline-none"
                />
                <div className="relative z-10 pointer-events-none">
                  <span
                    className={[
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs",
                      isToday
                        ? "bg-baby-blue/20 text-baby-blue"
                        : cell.inMonth
                          ? "text-off-white/80"
                          : "text-off-white/35",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>

                  <ul className="mt-1 space-y-1">
                    {dayEvents.map((occurrence) => {
                      const timeLabel = formatTime(occurrence.event.start_time);
                      return (
                        <li
                          key={`${occurrence.event.id}-${occurrence.occurrenceDate}`}
                        >
                          <button
                            type="button"
                            onClick={() => openView(occurrence)}
                            className={[
                              "pointer-events-auto flex w-full items-center gap-1 truncate rounded border px-1.5 py-0.5 text-left text-[11px] text-off-white/90 hover:border-baby-blue/50",
                              occurrence.isRecurring
                                ? "border-baby-blue/40 bg-baby-blue/15"
                                : "border-baby-blue/25 bg-baby-blue/10",
                            ].join(" ")}
                            title={
                              occurrence.isRecurring
                                ? `${occurrence.event.title} (recurring)`
                                : occurrence.event.title
                            }
                          >
                            {occurrence.isRecurring ? <RepeatIcon /> : null}
                            <span className="truncate">
                              {timeLabel ? `${timeLabel} ` : ""}
                              {occurrence.event.title}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-off-white/15 bg-charcoal p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {modal.type === "create" ? (
              <>
                <h2
                  id={titleId}
                  className="font-serif text-xl tracking-tight text-off-white"
                >
                  New event
                </h2>
                <p className="mt-1 text-sm text-off-white/55">
                  {formatDayHeading(modal.date)}
                </p>

                <form onSubmit={handleCreate} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-xs tracking-wide text-off-white/55 uppercase">
                      Title
                    </span>
                    <input
                      required
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue"
                      placeholder="Site visit, follow-up…"
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
                          (nextValue === "weekly" ||
                            nextValue === "biweekly") &&
                          recurrenceDays.length === 0
                        ) {
                          setRecurrenceDays([
                            weekdayFromDateKey(modal.date),
                          ]);
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
                      Repeats on day {Number(modal.date.slice(-2))} each month.
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
                        min={modal.date}
                        onChange={(event) =>
                          setRecurrenceEndDate(event.target.value)
                        }
                        className="mt-1.5 w-full rounded-md border border-off-white/15 bg-black px-3 py-2 text-sm text-off-white outline-none focus:border-baby-blue [color-scheme:dark]"
                      />
                      <span className="mt-1 block text-[11px] text-off-white/40">
                        Leave blank to repeat indefinitely (shown up to 12
                        months from the start date).
                      </span>
                    </label>
                  ) : null}

                  {error ? (
                    <p className="text-sm text-baby-blue">{error}</p>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
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
                      {isPending ? "Saving…" : "Create event"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2
                  id={titleId}
                  className="font-serif text-xl tracking-tight text-off-white"
                >
                  {modal.occurrence.event.title}
                </h2>
                <p className="mt-1 text-sm text-off-white/55">
                  {formatDayHeading(modal.occurrence.occurrenceDate)}
                </p>

                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs tracking-wide text-off-white/45 uppercase">
                      Time
                    </dt>
                    <dd className="mt-1 text-off-white/85">
                      {formatTime(modal.occurrence.event.start_time) ||
                      formatTime(modal.occurrence.event.end_time)
                        ? [
                            formatTime(modal.occurrence.event.start_time) ??
                              "—",
                            formatTime(modal.occurrence.event.end_time),
                          ]
                            .filter(Boolean)
                            .join(" – ")
                        : "All day / no time set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-off-white/45 uppercase">
                      Notes
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-off-white/85">
                      {modal.occurrence.event.notes?.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-off-white/45 uppercase">
                      Recurrence
                    </dt>
                    <dd className="mt-1 text-off-white/85">
                      <span className="inline-flex items-center gap-1.5">
                        {modal.occurrence.isRecurring ? <RepeatIcon /> : null}
                        {recurrenceLabel(modal.occurrence.event.recurrence)}
                      </span>
                      {modal.occurrence.event.recurrence_end_date ? (
                        <span className="mt-1 block text-xs text-off-white/50">
                          Until{" "}
                          {formatDayHeading(
                            modal.occurrence.event.recurrence_end_date,
                          )}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>

                {error ? (
                  <p className="mt-4 text-sm text-baby-blue">{error}</p>
                ) : null}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="rounded-md border border-off-white/15 px-3 py-2 text-sm text-off-white/70 transition-colors hover:border-off-white/30 disabled:opacity-60"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(modal.occurrence.event)}
                    disabled={isPending}
                    className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isPending
                      ? "Deleting…"
                      : modal.occurrence.isRecurring
                        ? "Delete series"
                        : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
