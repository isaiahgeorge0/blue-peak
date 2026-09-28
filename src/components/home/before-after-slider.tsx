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

/**
 * Vertical divider between before/after photos. Pointer + touch draggable.
 */
export function BeforeAfterSlider({
  beforeSrc = "/home/before.jpg",
  afterSrc = "/home/after.jpg",
  beforeAlt = "Kitchen before renovation",
  afterAlt = "Kitchen after renovation",
  caption = "Stock before/after pair for layout - replace with a Blue Peak project.",
}: BeforeAfterSliderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(52);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(92, Math.max(8, next)));
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

  return (
    <section className="bg-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        <h2 className="text-3xl tracking-tight text-off-white sm:text-4xl">
          Before and after
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-off-white/70">
          Drag the handle to compare. Real Blue Peak project photos will replace
          these stock images.
        </p>

        <div
          ref={frameRef}
          className="relative mt-10 aspect-[16/10] w-full touch-none overflow-hidden rounded-xl border border-off-white/10 bg-black select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="Before and after comparison slider"
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
            className="absolute inset-y-0 z-10 w-px bg-baby-blue"
            style={{ left: `${position}%` }}
          >
            <button
              type="button"
              aria-label="Drag to compare before and after"
              className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-baby-blue/60 bg-black/80 text-baby-blue shadow-lg"
            >
              <span aria-hidden className="text-sm tracking-tight">
                {"< >"}
              </span>
            </button>
          </div>

          <span className="pointer-events-none absolute top-3 left-3 rounded bg-black/70 px-2 py-1 text-[11px] tracking-wide text-off-white/80 uppercase">
            Before
          </span>
          <span className="pointer-events-none absolute top-3 right-3 rounded bg-black/70 px-2 py-1 text-[11px] tracking-wide text-off-white/80 uppercase">
            After
          </span>
        </div>
        <p className="mt-3 text-xs text-off-white/45">{caption}</p>
      </div>
    </section>
  );
}
