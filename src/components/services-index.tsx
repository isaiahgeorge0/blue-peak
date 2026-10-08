"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand/brand-logo";
import { ArrowIcon } from "@/components/section-heading";
import { containerWide } from "@/lib/image-sizes";

type IndexService = {
  slug: string;
  name: string;
  shortDescription: string;
  image?: string;
  imageAlt?: string;
};

/** Matches the crossfade duration in the panel's class names. */
const FADE_MS = 250;

type Layers = {
  /** Photos showing, bottom to top. The bottom one is always fully opaque. */
  stack: number[];
  /** Stacking order per photo, raised each time it comes to the top. */
  z: number[];
  next: number;
};

/**
 * Brings `target` to the top. A photo that is already showing stays put and
 * whatever is above it fades away; any other photo fades in on top.
 */
function raise(layers: Layers, target: number): Layers {
  const at = layers.stack.indexOf(target);
  if (at !== -1) return { ...layers, stack: layers.stack.slice(0, at + 1) };
  const z = [...layers.z];
  z[target] = layers.next;
  return { stack: [...layers.stack, target], z, next: layers.next + 1 };
}

/**
 * The services as a numbered list. From lg it sits beside a sticky photo
 * panel: the active row (hovered, focused, or else the one crossing the middle
 * of the screen) shifts right with an arrow, and the panel crossfades to its
 * photo. Each incoming photo fades in over the ones already showing, which
 * are only hidden once it is fully opaque, so however quickly the rows
 * change the panel's background never shows; all the panel's photos load
 * together once it is near the screen. Below lg each row carries its own
 * photo instead.
 */
export function ServicesIndex({ services }: { services: IndexService[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [scrolled, setScrolled] = useState(0);
  const [pointed, setPointed] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const active = focused ?? pointed ?? scrolled;
  const [layers, setLayers] = useState<Layers>(() => ({
    stack: [active],
    z: services.map(() => 0),
    next: 1,
  }));
  const top = layers.stack[layers.stack.length - 1];
  if (top !== active) {
    setLayers(raise(layers, active));
  }

  useEffect(() => {
    const settle = window.setTimeout(() => {
      setLayers((current) =>
        current.stack[current.stack.length - 1] === top && current.stack.length > 1
          ? { ...current, stack: [top] }
          : current,
      );
    }, FADE_MS + 20);
    return () => window.clearTimeout(settle);
  }, [top]);

  useEffect(() => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-row]");
    if (!rows) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setScrolled(Number(entry.target.getAttribute("data-row")));
        }
      },
      { rootMargin: "-50% 0px -49% 0px" },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <ol
        ref={listRef}
        className="services-index grid gap-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 lg:block lg:border-b lg:border-ink/15"
        onPointerLeave={() => setPointed(null)}
      >
        {services.map((service, index) => (
          <li key={service.slug} data-row={index}>
            <Link
              href={`/services/${service.slug}`}
              data-active={index === active}
              className="services-row group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:border-t lg:border-ink/15 lg:py-9"
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setPointed(index);
              }}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused(null)}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-panel lg:hidden">
                {service.image ? (
                  <Image
                    src={service.image}
                    alt={service.imageAlt ?? ""}
                    fill
                    sizes="(max-width: 639px) calc(100vw - 3rem), calc(50vw - 2.5rem)"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BrandMark title="" className="h-14 w-auto text-brand/15" />
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-5 lg:mt-0 lg:gap-8">
                <p className="pt-1.5 text-sm font-bold tracking-[0.2em] text-accent lg:pt-4">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-4 transition-transform duration-[250ms] ease-out motion-reduce:transition-none lg:group-data-[active=true]:translate-x-3">
                    <h2 className="text-3xl leading-tight tracking-heading text-ink lg:text-5xl lg:leading-[1.05] lg:tracking-display">
                      {service.name}
                    </h2>
                    <span
                      aria-hidden
                      className="hidden -translate-x-2 text-accent opacity-0 [&>svg]:size-6 transition-[opacity,transform] duration-[250ms] ease-out motion-reduce:transition-none lg:block lg:group-data-[active=true]:translate-x-0 lg:group-data-[active=true]:opacity-100"
                    >
                      <ArrowIcon />
                    </span>
                  </div>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70 lg:text-lg">
                    {service.shortDescription}
                  </p>
                  <span className="link-arrow mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent lg:hidden">
                    Learn more
                    <ArrowIcon />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-[calc(var(--site-header-height)+2rem)]">
          <div className="relative ml-auto aspect-[4/5] w-[min(100%,calc((100svh-var(--site-header-height)-4rem)*0.8))] overflow-hidden rounded-xl bg-panel">
            {services.map((service, index) =>
              service.image ? (
                <Image
                  key={service.slug}
                  src={service.image}
                  alt=""
                  fill
                  sizes={`${containerWide(484)}, 42vw`}
                  style={{ zIndex: layers.z[index] }}
                  className={`object-cover transition-opacity duration-[250ms] ease-out motion-reduce:transition-none ${
                    layers.stack.includes(index) ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
