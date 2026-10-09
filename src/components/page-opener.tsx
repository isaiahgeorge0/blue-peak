"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { SampleTag } from "@/components/sample-tag";

type PageOpenerProps = {
  eyebrow: string;
  /**
   * Shows the eyebrow as a breadcrumb instead: the eyebrow links to `href`,
   * followed by the current page's name.
   */
  breadcrumb?: { href: string; current: string };
  /** The page's h1, as plain text so it can be split into words. */
  title: string;
  lede?: ReactNode;
  /** Placeholder photo or content: shows the Sample tag. */
  sample?: boolean;
  image: {
    src: string;
    alt: string;
    /** Width over height of the photo file, for `sizes`. */
    aspect?: number;
  };
  /** Anything else under the lede, such as a sample note. */
  children?: ReactNode;
};

/** Fraction of the viewport height the opener fills. */
const HEIGHT = 0.85;

const subscribeNever = () => () => {};

/** False on the server and during hydration, true once mounted in the browser. */
export function useHasMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * Gives each word of the title its line number (capped at 3) as --line, so
 * words on the same line rise together. Runs inline at the end of the copy on
 * the first load, before the first paint, so it must not reference anything
 * outside itself; after a client-side navigation the layout effect runs it.
 */
function numberLines(words: Element) {
  let top: number | null = null;
  let line = -1;
  words.querySelectorAll<HTMLElement>(".page-opener-word").forEach((word) => {
    if (word.offsetTop !== top) {
      top = word.offsetTop;
      line += 1;
    }
    word.style.setProperty("--line", String(Math.min(line, 3)));
  });
}

/** Entrance delay for an opener's eyebrow, lede or extras (.page-opener-item). */
export const openerItem = (at: number) =>
  ({ "--item-at": `${at}ms` }) as CSSProperties;

const item = openerItem;

/**
 * An opener's h1: read whole by screen readers, drawn as words that rise
 * line by line out of their masks. Pair it with <OpenerLineScript /> as the
 * last thing in the same copy block.
 */
export function OpenerTitle({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (titleRef.current) numberLines(titleRef.current);
  }, [title]);

  return (
    <h1 className={className}>
      <span className="sr-only">{title}</span>
      <span ref={titleRef} aria-hidden>
        {title.split(" ").map((word, index) => (
          <Fragment key={index}>
            {index > 0 ? " " : null}
            <span className="page-opener-word" suppressHydrationWarning>
              <span>{word}</span>
            </span>
          </Fragment>
        ))}
      </span>
    </h1>
  );
}

/**
 * Numbers the title's lines before the first paint of a server render (client
 * renders use OpenerTitle's layout effect). Put it last in the copy block that
 * holds the h1: the browser can paint when the parser stops for a script, and
 * the copy must be complete by then or it grows upwards on the next frame.
 */
export function OpenerLineScript() {
  const mounted = useHasMounted();
  if (mounted) return null;
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${numberLines.toString()})(document.currentScript.parentElement.querySelector("h1 > [aria-hidden]"))`,
      }}
    />
  );
}

/**
 * Full-bleed photo that opens an inner page, with the breadcrumb or eyebrow,
 * h1 and lede set on it at the bottom left. 85% of the screen tall, so the
 * next section shows below; on screens too short for the copy it grows to
 * fit. As the page scrolls the photo moves at 85% of the scroll speed and the
 * copy lifts and fades, on the same scroll timeline as the homepage hero.
 */
export function PageOpener({
  eyebrow,
  breadcrumb,
  title,
  lede,
  sample = false,
  image,
  children,
}: PageOpenerProps) {
  const reduceMotion = useReducedMotion() === true;
  const mounted = useHasMounted();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const copyY = useTransform(scrollYProgress, [0, 0.6], [0, -40]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // No inline transforms until mounted, so the server render and hydration match.
  const animate = mounted && !reduceMotion;
  const photoStyle: MotionStyle | undefined = animate ? { y: photoY } : undefined;
  const copyStyle: MotionStyle | undefined = animate
    ? { y: copyY, opacity: copyOpacity }
    : undefined;

  const aspect = image.aspect ?? 16 / 9;
  // The photo covers the opener, so on screens narrower than that it is drawn
  // wider than the viewport, at the opener height's width.
  const sizes = `(max-aspect-ratio: ${Math.round(aspect * HEIGHT * 1000)}/1000) calc(${HEIGHT * 100}vh * ${aspect.toFixed(4)}), 100vw`;

  return (
    <section
      ref={sectionRef}
      className="page-opener relative isolate flex min-h-[85svh] overflow-hidden bg-navy lg:min-h-[85vh]"
    >
      <motion.div className="page-opener-photo absolute inset-0" style={photoStyle}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          sizes={sizes}
          className="object-cover"
        />
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pt-[calc(var(--site-header-height)+2rem)] pb-10 sm:pb-12 lg:pb-16 [@media(max-height:31.2499rem)]:pb-6">
        <motion.div
          className="page-opener-copy relative isolate max-w-4xl"
          style={copyStyle}
        >
          {breadcrumb ? (
            <nav aria-label="Breadcrumb" className="page-opener-item" style={item(0)}>
              <ol className="flex flex-wrap items-center gap-x-2 text-xs font-bold tracking-[0.2em] uppercase">
                <li>
                  <Link
                    href={breadcrumb.href}
                    className="link-draw tap-target text-white"
                  >
                    {eyebrow}
                  </Link>
                </li>
                <li aria-hidden className="text-white/85">
                  /
                </li>
                <li>
                  <span aria-current="page" className="text-white/85">
                    {breadcrumb.current}
                  </span>
                </li>
              </ol>
            </nav>
          ) : (
            <p
              className="page-opener-item text-xs font-bold tracking-[0.2em] text-white/85 uppercase"
              style={item(0)}
            >
              {eyebrow}
            </p>
          )}
          {sample ? (
            <span className="page-opener-item mt-5 block" style={item(60)}>
              <SampleTag />
            </span>
          ) : null}
          <OpenerTitle
            title={title}
            className="page-title mt-4 max-w-4xl font-serif text-white"
          />
          {lede ? (
            <p
              className="page-opener-item mt-5 max-w-2xl text-lg leading-relaxed text-white/90 lg:text-xl [@media(max-height:31.2499rem)]:mt-3 [@media(max-height:31.2499rem)]:text-base"
              style={item(200)}
            >
              {lede}
            </p>
          ) : null}
          {children ? (
            <div
              className="page-opener-item mt-5 flex flex-wrap items-center gap-3 [@media(max-height:31.2499rem)]:mt-3"
              style={item(lede ? 280 : 200)}
            >
              {children}
            </div>
          ) : null}
          <OpenerLineScript />
        </motion.div>
      </div>
    </section>
  );
}
