"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useHomeMotionPreference } from "@/components/home/use-home-motion";
import { containerWide } from "@/lib/image-sizes";

type BeforeAfterSliderProps = {
  beforeSrc?: string;
  afterSrc?: string;
  beforeAlt?: string;
  afterAlt?: string;
};

const START = 50;
const KEY_STEP = 5;
/** The first-view hint: target position and time to get there, in turn. */
const SWEEP: ReadonlyArray<readonly [number, number]> = [
  [35, 400],
  [65, 800],
  [50, 400],
];
/** A touch has to travel this far before it counts as a drag or a scroll. */
const TOUCH_SLOP = 6;
/** A label fades out over this many px as the handle closes in on it. */
const LABEL_FADE = 40;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Solves a CSS cubic-bezier for y at progress x. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

function easeInOut() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--ease-in-out");
  const points = value.match(/-?[\d.]+/g)?.map(Number);
  return points?.length === 4 ? bezier(...(points as [number, number, number, number])) : bezier(0.65, 0, 0.35, 1);
}

/**
 * Before and after photos split by a draggable handle. Drag with a mouse or
 * finger, or click or tap to jump; on touch only horizontal drags move it, so
 * vertical swipes still scroll the page. The handle is an ARIA slider (arrows
 * 5%, Home and End). The first time it scrolls into view it sweeps once to
 * show it moves, unless reduced motion is on or the visitor gets there first.
 * Everything that moves is transformed, never laid out again.
 */
export function BeforeAfterSlider({
  beforeSrc = "/home/before.jpg",
  afterSrc = "/home/after.jpg",
  beforeAlt = "Living room before renovation",
  afterAlt = "Living room after renovation",
}: BeforeAfterSliderProps) {
  const reduceMotion = useHomeMotionPreference();
  const frameRef = useRef<HTMLDivElement>(null);
  const beforeLabelRef = useRef<HTMLSpanElement>(null);
  const afterLabelRef = useRef<HTMLSpanElement>(null);
  const position = useRef(START);
  const geometry = useRef({ width: 0, beforeEdge: 0, afterEdge: 0 });
  const sweep = useRef({ frame: 0, done: false });
  const drag = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null);
  const [value, setValue] = useState(START);
  const [dragging, setDragging] = useState(false);

  /** Moves the handle without a React render; `announce` also updates the slider value. */
  const place = useCallback((next: number, announce = true) => {
    const frame = frameRef.current;
    if (!frame) return;
    position.current = next;
    frame.style.setProperty("--pos", String(next));
    const { width, beforeEdge, afterEdge } = geometry.current;
    const x = (next / 100) * width;
    const fade = (gap: number) => String(Math.min(1, Math.max(0, gap / LABEL_FADE)));
    if (beforeLabelRef.current) beforeLabelRef.current.style.opacity = fade(x - beforeEdge);
    if (afterLabelRef.current) afterLabelRef.current.style.opacity = fade(width - x - afterEdge);
    if (announce) setValue(Math.round(next));
  }, []);

  const stopSweep = useCallback(() => {
    sweep.current.done = true;
    if (sweep.current.frame) {
      cancelAnimationFrame(sweep.current.frame);
      sweep.current.frame = 0;
      setValue(Math.round(position.current));
    }
  }, []);

  // Size the transforms and the label fades to the frame; runs before paint.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const box = frame.getBoundingClientRect();
      // A label is covered once the handle's grip (half its width) reaches it.
      const grip = frame.querySelector<HTMLElement>("[role=slider]")?.offsetWidth ?? 44;
      const edge = (label: HTMLElement | null, side: "left" | "right") => {
        if (!label) return 0;
        const r = label.getBoundingClientRect();
        return (side === "left" ? r.right - box.left : box.right - r.left) + grip / 2;
      };
      geometry.current = {
        width: box.width,
        beforeEdge: edge(beforeLabelRef.current, "left"),
        afterEdge: edge(afterLabelRef.current, "right"),
      };
      frame.style.setProperty("--w", `${box.width}px`);
      place(position.current, false);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [place]);

  // The one-off sweep when the slider first comes into view.
  useEffect(() => {
    const frame = frameRef.current;
    const state = sweep.current;
    if (!frame || reduceMotion || state.done) return;
    const run = () => {
      const ease = easeInOut();
      let leg = 0;
      let from = position.current;
      let start = performance.now();
      const tick = (now: number) => {
        const [to, ms] = SWEEP[leg];
        const t = Math.min(1, (now - start) / ms);
        place(from + (to - from) * ease(t), false);
        if (t < 1) {
          state.frame = requestAnimationFrame(tick);
          return;
        }
        leg += 1;
        if (leg === SWEEP.length) {
          state.frame = 0;
          state.done = true;
          setValue(Math.round(position.current));
          return;
        }
        from = to;
        start = now;
        state.frame = requestAnimationFrame(tick);
      };
      state.frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || state.done) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
    };
  }, [reduceMotion, place]);

  const moveTo = (clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    place(clamp(((clientX - box.left) / box.width) * 100));
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    stopSweep();
    // Mouse and pen take hold at once; a touch waits to see which way it goes.
    const active = event.pointerType !== "touch";
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active };
    if (active) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      moveTo(event.clientX);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.active) {
      const dx = Math.abs(event.clientX - current.x);
      const dy = Math.abs(event.clientY - current.y);
      if (dx < TOUCH_SLOP && dy < TOUCH_SLOP) return;
      // Mostly vertical: leave it to the page (touch-action: pan-y scrolls it).
      if (dy >= dx) {
        drag.current = null;
        return;
      }
      current.active = true;
      setDragging(true);
    }
    moveTo(event.clientX);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    // A tap that never became a drag jumps the handle there.
    if (!current.active) moveTo(event.clientX);
    endDrag();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const steps: Record<string, (now: number) => number> = {
      ArrowLeft: (now) => now - KEY_STEP,
      ArrowDown: (now) => now - KEY_STEP,
      ArrowRight: (now) => now + KEY_STEP,
      ArrowUp: (now) => now + KEY_STEP,
      PageDown: (now) => now - 10,
      PageUp: (now) => now + 10,
      Home: () => 0,
      End: () => 100,
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    stopSweep();
    place(clamp(step(position.current)));
  };

  // Below sm the 16:10 photos fill a 4:5 frame, so they are drawn twice the frame's width.
  // From lg the slider takes two thirds of the container, beside its heading.
  const sizes = `${containerWide(693)}, (max-width: 639px) calc(200vw - 64px), (max-width: 1023px) calc(100vw - 48px), (max-width: 1152px) calc(66.67vw - 75px), 693px`;

  return (
    <div
      ref={frameRef}
      className="group relative aspect-[4/5] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-xl bg-panel select-none sm:aspect-video"
      style={{ "--pos": START, "--w": "0px" } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endDrag}
    >
      <Image
        src={afterSrc}
        alt={afterAlt}
        fill
        sizes={sizes}
        className="object-cover"
        draggable={false}
      />
      {/* Clipped by sliding a window over the photo and the photo back the other way. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ transform: "translateX(calc((var(--pos) - 100) * 1%))" }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: "translateX(calc((100 - var(--pos)) * 1%))" }}
        >
          <Image
            src={beforeSrc}
            alt={beforeAlt}
            fill
            sizes={sizes}
            className="object-cover"
            draggable={false}
          />
        </div>
      </div>

      <span
        ref={beforeLabelRef}
        className="pointer-events-none absolute top-3 left-3 rounded-full bg-navy/80 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-white uppercase sm:top-4 sm:left-4"
      >
        Before
      </span>
      <span
        ref={afterLabelRef}
        className="pointer-events-none absolute top-3 right-3 rounded-full bg-navy/80 px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-white uppercase sm:top-4 sm:right-4"
      >
        After
      </span>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -ml-px w-0.5 bg-white shadow-[0_0_6px_rgb(14_34_64/0.35)]"
        style={{ transform: "translateX(calc(var(--pos) * var(--w) / 100))" }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}% before, ${100 - value}% after`}
        onKeyDown={onKeyDown}
        onFocus={stopSweep}
        className="absolute top-1/2 left-0 -mt-[1.375rem] size-11 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        style={{
          transform:
            "translateX(clamp(0rem, calc(var(--pos) * var(--w) / 100 - 1.375rem), calc(var(--w) - 2.75rem)))",
        }}
      >
        <span
          className={`flex size-full items-center justify-center rounded-full bg-white text-navy shadow-lg shadow-navy/30 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none ${
            dragging ? "scale-110" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>
    </div>
  );
}
