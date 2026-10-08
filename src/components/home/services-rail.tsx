"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { BrandMark } from "@/components/brand/brand-logo";
import { textLinkClassName } from "@/components/cta-styles";
import { ArrowIcon, SectionHeading } from "@/components/section-heading";
import { services } from "@/lib/content";
import { remWide } from "@/lib/image-sizes";
import { PINNABLE_QUERY } from "@/lib/pinnable";

/**
 * Fractions of the pinned travel over which the row moves. The short holds at
 * each end keep the first and last cards fully in view as the pin starts/ends.
 */
const RAIL_START = 0.06;
const RAIL_END = 0.94;
/** Must match the pinnable:lg: classes that pin the section. */
const PINNED_QUERY = `(min-width: 1024px) and ${PINNABLE_QUERY}`;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * What we do. From lg up (motion allowed, screen tall enough) the section pins
 * and vertical scroll slides the row of service cards sideways. Otherwise it is a swipeable
 * scroll-snap row; with reduced motion it is a plain grid.
 */
export function ServicesRail() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const distance = useMotionValue(0);
  const swipeProgress = useMotionValue(0);
  const [current, setCurrent] = useState(1);
  const [nearViewport, setNearViewport] = useState(false);
  const total = services.length;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const railProgress = useTransform(
    scrollYProgress,
    [RAIL_START, RAIL_END],
    [0, 1],
  );
  const railX = useTransform(
    () => `${-railProgress.get() * distance.get()}px`,
  );

  useMotionValueEvent(railProgress, "change", (progress) => {
    if (!window.matchMedia(PINNED_QUERY).matches) return;
    setCurrent(Math.round(progress * (total - 1)) + 1);
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      distance.set(Math.max(0, track.offsetWidth - viewport.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [distance]);

  /**
   * Native lazy loading fetches each card only as it nears the viewport, which
   * in the pinned and swipe rows means mid-slide. Load all of them together
   * once the section is within one screen instead.
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const onViewportScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport || window.matchMedia(PINNED_QUERY).matches) return;
    const max = viewport.scrollWidth - viewport.clientWidth;
    const progress = max > 0 ? viewport.scrollLeft / max : 0;
    swipeProgress.set(progress);
    setCurrent(Math.round(progress * (total - 1)) + 1);
  };

  /**
   * Keyboard focus. Swipe row: bring the card to its snap position (the default
   * "nearest" scroll fights scroll-snap). Pinned: scroll the page so the
   * focused card is on screen.
   */
  const onFocusCapture = (event: FocusEvent<HTMLUListElement>) => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const card = (event.target as HTMLElement).closest("li");
    if (!section || !viewport || !card) return;

    if (!window.matchMedia(PINNED_QUERY).matches) {
      if (viewport.scrollWidth > viewport.clientWidth) {
        card.scrollIntoView({ block: "nearest", inline: "start" });
      }
      return;
    }

    const max = distance.get();
    if (max <= 0) return;

    window.requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const pinned = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
      const shift = -railProgress.get() * max;
      const left = card.offsetLeft + shift;
      const right = left + card.offsetWidth;
      if (pinned && left >= 0 && right <= viewport.clientWidth) return;

      let targetShift = shift;
      if (left < 0 || !pinned) targetShift = -card.offsetLeft;
      if (card.offsetLeft + targetShift + card.offsetWidth > viewport.clientWidth) {
        targetShift = viewport.clientWidth - card.offsetLeft - card.offsetWidth;
      }
      const railP = Math.min(1, Math.max(0, -targetShift / max));
      const scrollP = RAIL_START + railP * (RAIL_END - RAIL_START);
      const travel = rect.height - window.innerHeight;
      window.scrollTo({ top: window.scrollY + rect.top + scrollP * travel });
    });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="services-heading"
      className="relative bg-page pinnable:lg:h-[230vh]"
      style={
        {
          "--rail-gutter": "max(1.5rem, calc((100vw - var(--container-6xl)) / 2 + 1.5rem))",
        } as CSSProperties
      }
    >
      <div className="pinnable:lg:sticky pinnable:lg:top-0 pinnable:lg:flex pinnable:lg:h-[100dvh] pinnable:lg:items-center pinnable:lg:overflow-hidden">
        <div className="w-full py-20 lg:py-28 pinnable:lg:flex pinnable:lg:items-center pinnable:lg:py-0">
          <div className="mx-auto max-w-6xl px-6 pinnable:lg:mx-0 pinnable:lg:w-[calc(var(--rail-gutter)+22rem)] pinnable:lg:max-w-none pinnable:lg:shrink-0 pinnable:lg:pr-12 pinnable:lg:pl-[var(--rail-gutter)]">
            <SectionHeading eyebrow="What we do" id="services-heading">
              Every trade your home needs, from <em>one team.</em>
            </SectionHeading>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink/70">
              No juggling separate firms. We plan it, build it and finish it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 pinnable:lg:mt-12 pinnable:lg:flex-col pinnable:lg:items-start">
              <p
                className="text-sm tracking-[0.2em] text-ink/70 tabular-nums motion-reduce:hidden"
                aria-hidden
              >
                <span className="text-ink">{pad(current)}</span> / {pad(total)}
              </p>
              <Link href="/services" className={textLinkClassName}>
                See all services
                <ArrowIcon />
              </Link>
            </div>
          </div>

          <div className="min-w-0 pinnable:lg:flex-1">
            <div
              ref={viewportRef}
              onScroll={onViewportScroll}
              className="mt-10 snap-x snap-mandatory scroll-px-6 overflow-x-auto overscroll-x-contain [scrollbar-width:none] pinnable:lg:mt-0 pinnable:lg:snap-none pinnable:lg:overflow-x-clip motion-reduce:mx-auto motion-reduce:max-w-6xl motion-reduce:snap-none motion-reduce:overflow-x-visible motion-reduce:px-6 [&::-webkit-scrollbar]:hidden"
            >
              <motion.ul
                ref={trackRef}
                onFocusCapture={onFocusCapture}
                style={{ "--rail-x": railX } as MotionStyle}
                className="flex w-max gap-5 px-6 sm:gap-6 pinnable:lg:translate-x-[var(--rail-x)] pinnable:lg:pr-[var(--rail-gutter)] pinnable:lg:pl-0 motion-reduce:grid motion-reduce:w-auto motion-reduce:grid-cols-2 motion-reduce:gap-x-4 motion-reduce:gap-y-8 motion-reduce:px-0 motion-reduce:sm:gap-x-6 motion-reduce:sm:gap-y-10 motion-reduce:lg:grid-cols-4"
              >
                {services.map((service) => (
                  <li
                    key={service.slug}
                    className="w-[min(78vw,340px)] shrink-0 snap-start pinnable:lg:w-[min(21.25rem,calc((100dvh-15rem)*0.75))] motion-reduce:w-auto"
                  >
                    <Link
                      href={`/services/${service.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-panel max-sm:motion-reduce:aspect-square">
                        {service.image ? (
                          <Image
                            src={service.image}
                            alt={service.imageAlt ?? ""}
                            fill
                            loading={nearViewport ? "eager" : "lazy"}
                            sizes={`${remWide(340)}, (max-width: 1023px) 78vw, 340px`}
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BrandMark
                              title=""
                              className="h-14 w-auto text-brand/15"
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-5 flex items-start justify-between gap-4 max-sm:motion-reduce:mt-3 max-sm:motion-reduce:gap-2">
                        <h3 className="text-2xl leading-tight font-semibold text-ink max-sm:motion-reduce:text-lg">
                          {service.name}
                        </h3>
                        <ArrowIcon className="mt-2 shrink-0 text-accent max-sm:motion-reduce:mt-1" />
                      </div>
                      <p className="mt-2 text-base leading-relaxed text-ink/70">
                        {service.shortDescription}
                      </p>
                    </Link>
                  </li>
                ))}
              </motion.ul>
            </div>

            <div
              className="mx-6 mt-8 h-[2px] overflow-hidden bg-ink/10 pinnable:lg:mr-[var(--rail-gutter)] pinnable:lg:ml-0 motion-reduce:hidden"
              aria-hidden
            >
              <motion.div
                className="hidden h-full origin-left bg-accent pinnable:lg:block"
                style={{ scaleX: railProgress }}
              />
              <motion.div
                className="h-full origin-left bg-accent pinnable:lg:hidden"
                style={{ scaleX: swipeProgress }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
