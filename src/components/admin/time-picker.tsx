"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = [0, 15, 30, 45] as const;

type TimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  placeholder?: string;
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
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

function toStoredTime(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

function formatDisplayTime(value: string) {
  const parsed = parseTimeValue(value);
  if (!parsed) return null;

  const period = parsed.hour >= 12 ? "PM" : "AM";
  const hour12 = parsed.hour % 12 === 0 ? 12 : parsed.hour % 12;
  return `${hour12}:${pad2(parsed.minute)} ${period}`;
}

function hourLabel(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12} ${period}`;
}

function nearestQuarter(minute: number) {
  const snapped = Math.round(minute / 15) * 15;
  if (snapped === 60) return 45;
  return snapped as (typeof MINUTES)[number];
}

export function TimePicker({
  id,
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel = "Time",
  placeholder = "Select time",
}: TimePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTimeValue(value), [value]);
  const [draftHour, setDraftHour] = useState<number | null>(parsed?.hour ?? null);
  const [draftMinute, setDraftMinute] = useState<number | null>(
    parsed ? nearestQuarter(parsed.minute) : null,
  );

  useEffect(() => {
    if (!open) return;
    setDraftHour(parsed?.hour ?? null);
    setDraftMinute(parsed ? nearestQuarter(parsed.minute) : null);
  }, [open, parsed]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const hourEl = hourListRef.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    const minuteEl = minuteListRef.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    hourEl?.scrollIntoView({ block: "center" });
    minuteEl?.scrollIntoView({ block: "center" });
  }, [open, draftHour, draftMinute]);

  function commit(hour: number, minute: number) {
    onChange(toStoredTime(hour, minute));
    setOpen(false);
  }

  function selectHour(hour: number) {
    setDraftHour(hour);
    if (draftMinute !== null) {
      commit(hour, draftMinute);
    }
  }

  function selectMinute(minute: number) {
    setDraftMinute(minute);
    if (draftHour !== null) {
      commit(draftHour, minute);
    }
  }

  const display = formatDisplayTime(value) ?? placeholder;

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className={[
          "flex w-full items-center justify-between rounded-md border bg-black px-3 py-2 text-left text-sm outline-none transition-colors",
          open ? "border-baby-blue" : "border-off-white/15 hover:border-off-white/30",
          formatDisplayTime(value) ? "text-off-white" : "text-off-white/45",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <span>{display}</span>
        <span className="text-off-white/35" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${ariaLabel} options`}
          className="absolute z-20 mt-1.5 grid w-full min-w-[11rem] grid-cols-2 gap-1 rounded-md border border-off-white/15 bg-black p-1.5 shadow-xl"
        >
          <div
            ref={hourListRef}
            className="max-h-48 overflow-y-auto overscroll-contain rounded-md border border-off-white/10"
          >
            {HOURS.map((hour) => {
              const selected = draftHour === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? "true" : undefined}
                  onClick={() => selectHour(hour)}
                  className={[
                    "block w-full px-2.5 py-1.5 text-left text-sm transition-colors",
                    selected
                      ? "bg-baby-blue/20 text-baby-blue"
                      : "text-off-white/75 hover:bg-off-white/5 hover:text-off-white",
                  ].join(" ")}
                >
                  {hourLabel(hour)}
                </button>
              );
            })}
          </div>

          <div
            ref={minuteListRef}
            className="max-h-48 overflow-y-auto overscroll-contain rounded-md border border-off-white/10"
          >
            {MINUTES.map((minute) => {
              const selected = draftMinute === minute;
              return (
                <button
                  key={minute}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected ? "true" : undefined}
                  onClick={() => selectMinute(minute)}
                  className={[
                    "block w-full px-2.5 py-1.5 text-left text-sm tabular-nums transition-colors",
                    selected
                      ? "bg-baby-blue/20 text-baby-blue"
                      : "text-off-white/75 hover:bg-off-white/5 hover:text-off-white",
                  ].join(" ")}
                >
                  :{pad2(minute)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
