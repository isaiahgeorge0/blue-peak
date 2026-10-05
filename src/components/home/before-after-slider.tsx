"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeAlt?: string;
  afterAlt?: string;
  caption?: string;
};

const MIN_POSITION = 8;
const MAX_POSITION = 92;
const clampPosition = (value: number) =>
  Math.min(MAX_POSITION, Math.max(MIN_POSITION, value));

/**
 * Vertical divider between before/after photos. Pointer, touch and keyboard
 * operable (the handle is an ARIA slider).
 * The default pair is stock imagery; swap in a real Blue Peak project.
 */
export function BeforeAfterSlider({
  beforeSrc = "/home/before.jpg",
  afterSrc = "/home/after.jpg",
  beforeAlt = "Kitchen before renovation",
  afterAlt = "Kitchen after renovation",
  caption,
}: BeforeAfterSliderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(52);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clampPosition(next));
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    dragging.current = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging.current) return;
    updateFromClientX(event.clientX);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    dragging.current = false;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  };

  const onHandleKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, (current: number) => number> = {
      ArrowLeft: (current) => current - 2,
      ArrowDown: (current) => current - 2,
      ArrowRight: (current) => current + 2,
      ArrowUp: (current) => current + 2,
      PageDown: (current) => current - 10,
      PageUp: (current) => current + 10,
      Home: () => MIN_POSITION,
      End: () => MAX_POSITION,
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    setPosition((current) => clampPosition(step(current)));
  };

  const shownBefore = Math.round(position);

  return (
    <div>
      <div
        ref={frameRef}
        className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-xl border border-ink/10 bg-page select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Image
          src={afterSrc}
          alt={afterAlt}
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={beforeSrc}
            alt={beforeAlt}
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
            draggable={false}
          />
        </div>

        <div
          className="absolute inset-y-0 z-10 w-px bg-accent"
          style={{ left: `${position}%` }}
        >
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after comparison"
            aria-orientation="horizontal"
            aria-valuemin={MIN_POSITION}
            aria-valuemax={MAX_POSITION}
            aria-valuenow={shownBefore}
            aria-valuetext={`${shownBefore}% before, ${100 - shownBefore}% after`}
            onKeyDown={onHandleKeyDown}
            className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-accent/60 bg-page text-accent shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            <span aria-hidden className="text-sm tracking-tight">
              {"< >"}
            </span>
          </div>
        </div>

        <span className="pointer-events-none absolute top-3 left-3 rounded bg-navy/80 px-2 py-1 text-[11px] font-medium tracking-wide text-white uppercase">
          Before
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded bg-navy/80 px-2 py-1 text-[11px] font-medium tracking-wide text-white uppercase">
          After
        </span>
      </div>
      {caption ? <p className="mt-3 text-xs text-ink/70">{caption}</p> : null}
    </div>
  );
}
