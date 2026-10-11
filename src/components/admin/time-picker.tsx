"use client";

import { ChevronDownIcon } from "@/components/admin/icons";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = [0, 15, 30, 45];

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** Accept HH:MM or HH:MM:SS from the DB / form state. */
function parseTimeValue(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

const selectClass =
  "h-11 w-full cursor-pointer appearance-none rounded-lg border border-admin-edge bg-admin-base pr-8 pl-3 text-[0.9375rem] text-ink tabular-nums hover:border-peak-fleet disabled:opacity-60";

/**
 * A 24-hour time as two native selects, hour and minutes in quarters, so it
 * uses the phone's own picker. Choosing "No time" for the hour clears it.
 */
export function TimePicker({ value, onChange, disabled = false, "aria-label": label = "Time" }: TimePickerProps) {
  const parsed = parseTimeValue(value);
  const minute = parsed ? Math.min(45, Math.round(parsed.minute / 15) * 15) : 0;

  return (
    <div className="mt-1.5 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">
      <span className="relative">
        <select
          aria-label={`${label}, hour`}
          value={parsed ? String(parsed.hour) : ""}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "") onChange("");
            else onChange(`${pad2(Number(event.target.value))}:${pad2(minute)}`);
          }}
          className={selectClass}
        >
          <option value="">No time</option>
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {pad2(hour)}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
      </span>
      <span className="relative">
        <select
          aria-label={`${label}, minutes`}
          value={String(minute)}
          disabled={disabled || !parsed}
          onChange={(event) => parsed && onChange(`${pad2(parsed.hour)}:${pad2(Number(event.target.value))}`)}
          className={selectClass}
        >
          {MINUTES.map((option) => (
            <option key={option} value={option}>
              :{pad2(option)}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
      </span>
    </div>
  );
}
