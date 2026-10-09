"use client";

import Link from "next/link";
import { useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowIcon } from "@/components/section-heading";
import { areaPositions } from "@/lib/area-geo";

type Area = { slug: string; name: string; shortDescription: string };

/* The diagram is drawn in miles, Ipswich at the origin and north up. */
const RINGS = [5, 10, 20];
const VIEW = { x: -23, y: -24, size: 46 };
const positions = areaPositions();

function place(slug: string) {
  const { miles, bearing } = positions[slug] ?? { miles: 0, bearing: 0 };
  const radians = (bearing * Math.PI) / 180;
  return {
    miles,
    bearing,
    x: miles * Math.sin(radians),
    y: -miles * Math.cos(radians),
  };
}

/** Which side of its dot a town's name sits. */
const LABEL_SIDE: Record<string, string> = {
  ipswich: "right-full mr-2.5 top-1/2 -translate-y-1/2",
  woodbridge: "left-full ml-2.5 top-1/2 -translate-y-1/2",
  felixstowe: "left-full ml-2.5 top-1/2 -translate-y-1/2",
  colchester: "top-full mt-2 left-1/2 -translate-x-1/2",
};

const percent = (value: number, from: number) =>
  `${(((value - from) / VIEW.size) * 100).toFixed(3)}%`;

/**
 * Where we work: each service area as a dot at its real distance and bearing
 * from Ipswich, inside rings at 5, 10 and 20 miles, beside the list of areas.
 * Pointing at or focusing a name or a dot marks the other and draws a line
 * out from Ipswich to the town.
 */
export function AreaMap({ areas }: { areas: Area[] }) {
  const [pointed, setPointed] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = focused ?? pointed;

  const handlers = (slug: string) => ({
    "data-active": active === slug ? true : undefined,
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") setPointed(slug);
    },
    onPointerLeave: () => setPointed((current) => (current === slug ? null : current)),
    onFocus: () => setFocused(slug),
    onBlur: () => setFocused((current) => (current === slug ? null : current)),
  });

  return (
    <div className="area-map mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
      <div className="relative mx-auto aspect-square w-full max-w-[32rem]">
        <svg
          aria-hidden
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.size} ${VIEW.size}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          {RINGS.map((miles) => (
            <circle
              key={miles}
              r={miles}
              fill="none"
              className="stroke-ink/20"
              strokeWidth={0.08}
            />
          ))}
          <path d="M 0 -20.6 L 0 -21.8" className="stroke-ink/70" strokeWidth={0.12} />

          {areas.map((area) => {
            const { miles, bearing } = place(area.slug);
            if (miles === 0) return null;
            return (
              <g key={area.slug} transform={`rotate(${(bearing - 90).toFixed(2)})`}>
                <line
                  className="area-map-line stroke-accent"
                  data-active={active === area.slug ? true : undefined}
                  x1={0}
                  y1={0}
                  x2={miles}
                  y2={0}
                  strokeWidth={0.2}
                />
              </g>
            );
          })}

        </svg>

        <span
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-full text-xs font-bold text-ink/70"
          style={{ left: percent(0, VIEW.x), top: percent(-22, VIEW.y) }}
        >
          N
        </span>
        {RINGS.map((miles) => (
          <span
            key={miles}
            aria-hidden
            className="area-map-halo-text absolute -translate-1/2 text-[0.6875rem] font-bold tracking-[0.1em] whitespace-nowrap text-ink/70"
            style={{
              left: percent(-miles * Math.SQRT1_2, VIEW.x),
              top: percent(-miles * Math.SQRT1_2, VIEW.y),
            }}
          >
            {miles} MI
          </span>
        ))}

        {areas.map((area) => {
          const { x, y, miles } = place(area.slug);
          const centre = miles === 0;
          return (
            <Link
              key={area.slug}
              href={`/areas/${area.slug}`}
              aria-label={
                centre ? area.name : `${area.name}, ${Math.round(miles)} miles from Ipswich`
              }
              className="area-map-dot tap-target absolute -translate-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              style={
                {
                  left: percent(x, VIEW.x),
                  top: percent(y, VIEW.y),
                } as CSSProperties
              }
              {...handlers(area.slug)}
            >
              <span
                aria-hidden
                className={`area-map-pin block rounded-full ${centre ? "size-4 bg-ink" : "size-3 bg-accent"}`}
              />
              <span
                className={`area-map-halo-text absolute text-sm font-bold whitespace-nowrap text-ink ${LABEL_SIDE[area.slug] ?? LABEL_SIDE.woodbridge}`}
              >
                {area.name}
              </span>
            </Link>
          );
        })}
      </div>

      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-1">
        {areas.map((area) => (
          <li key={area.slug} className="border-t border-ink/15">
            <Link
              href={`/areas/${area.slug}`}
              className="area-map-name group block py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:py-6"
              {...handlers(area.slug)}
            >
              <span className="area-map-name-row flex items-center gap-3">
                <span className="text-2xl leading-tight font-semibold text-ink">
                  {area.name}
                </span>
                <span aria-hidden className="area-map-arrow text-accent">
                  <ArrowIcon />
                </span>
              </span>
              <span className="mt-2 block text-lg leading-relaxed text-ink/70">
                {area.shortDescription}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
