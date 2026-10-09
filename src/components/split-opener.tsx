"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import type { ReactNode } from "react";
import {
  OpenerLineScript,
  OpenerTitle,
  openerItem,
  useHasMounted,
} from "@/components/page-opener";

type SplitOpenerProps = {
  eyebrow: string;
  /** The page's h1, as plain text so it can be split into words. */
  title: string;
  lede?: ReactNode;
  /** Under the lede, such as a phone number. */
  children?: ReactNode;
  image: {
    src: string;
    alt: string;
    /** Width over height of the photo file, for `sizes`. Defaults to 3:4. */
    aspect?: number;
    /** Extra classes for the photo's frame, such as a pitch cut. */
    frameClassName?: string;
  };
  /**
   * The other half of the screen. With it, the copy is set on the photo
   * (scrim, white type) in a left half that stays put while `aside` scrolls
   * past on the right; below lg the photo is left out and the copy comes
   * first, in ink. Without it, the copy takes the left half and the photo
   * the right; below lg the photo follows the copy at 4:5.
   */
  aside?: ReactNode;
};

/** The copy's left edge lines up with the main container's from lg. */
const containerInset =
  "lg:pl-[max(1.5rem,calc((100vw-var(--container-6xl))/2+1.5rem))]";

/**
 * Opener for pages whose photos are too small to fill the screen: copy on one
 * half and the photo on the other, the full height of the screen from lg.
 * The h1 rises line by line as on the other openers and the photo settles in
 * from a slight zoom, both once any page transition has finished. Beside the
 * copy, the photo drifts at 90% of the scroll speed.
 */
export function SplitOpener({
  eyebrow,
  title,
  lede,
  children,
  image,
  aside,
}: SplitOpenerProps) {
  const reduceMotion = useReducedMotion() === true;
  const mounted = useHasMounted();
  const { scrollY } = useScroll();
  // The opener starts at the top of the page, so page scroll is its scroll.
  const photoY = useTransform(scrollY, (y) => Math.min(Math.max(y, 0), 2000) * 0.1);
  const onPhoto = Boolean(aside);

  const aspect = image.aspect ?? 3 / 4;
  // From lg the photo covers half the screen, so on screens narrower than
  // twice its aspect it is drawn at the screen's height instead. Below lg it
  // is either left out (on-photo copy) or drawn full width at 4:5, slightly
  // taller than its frame to leave room for the drift.
  const desktopSizes = `(min-width: 1024px) and (max-aspect-ratio: ${Math.round(aspect * 2000)}/1000) calc(100vh * ${aspect.toFixed(4)}), (min-width: 1024px) 50vw`;
  const sizes = onPhoto ? `${desktopSizes}, 1px` : `${desktopSizes}, 110vw`;

  const photo = (
    <div className="split-opener-reveal absolute inset-0">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        preload
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );

  const copy = (
    <div
      className={`split-opener-copy relative isolate ${onPhoto ? "split-opener-onphoto max-w-2xl" : "max-w-xl"}`}
    >
      <p
        className={`page-opener-item text-xs font-bold tracking-[0.2em] text-accent uppercase ${onPhoto ? "lg:text-white/85" : ""}`}
        style={openerItem(0)}
      >
        {eyebrow}
      </p>
      <OpenerTitle
        title={title}
        className={`page-title mt-4 font-serif text-ink ${onPhoto ? "lg:text-white" : ""}`}
      />
      {lede ? (
        <p
          className={`page-opener-item mt-5 max-w-2xl text-lg leading-relaxed text-ink/75 lg:mt-6 lg:text-xl ${onPhoto ? "lg:text-white/90" : ""}`}
          style={openerItem(200)}
        >
          {lede}
        </p>
      ) : null}
      {children ? (
        <div className="page-opener-item mt-6 lg:mt-8" style={openerItem(280)}>
          {children}
        </div>
      ) : null}
      <OpenerLineScript />
    </div>
  );

  if (onPhoto) {
    return (
      <section className="split-opener relative bg-page lg:grid lg:grid-cols-2">
        <div className="relative lg:flex lg:min-h-[40rem] lg:flex-col lg:self-start lg:justify-end lg:overflow-hidden lg:bg-navy lg:[@media(min-height:40rem)]:sticky lg:[@media(min-height:40rem)]:top-0 lg:[@media(min-height:40rem)]:h-svh">
          <div className="hidden lg:block">{photo}</div>
          <div
            className={`relative px-6 pt-[calc(var(--site-header-height)+2.5rem)] pb-4 lg:pt-[calc(var(--site-header-height)+3rem)] lg:pr-12 lg:pb-16 ${containerInset}`}
          >
            {copy}
          </div>
        </div>
        {aside}
      </section>
    );
  }

  const photoStyle: MotionStyle | undefined =
    mounted && !reduceMotion ? { y: photoY } : undefined;

  return (
    <section className="split-opener relative bg-page lg:grid lg:min-h-[100vh] lg:grid-cols-2">
      <div
        className={`flex flex-col justify-center px-6 pt-[calc(var(--site-header-height)+2.5rem)] pb-12 sm:pb-16 lg:pt-[calc(var(--site-header-height)+3rem)] lg:pr-16 lg:pb-16 ${containerInset}`}
      >
        {copy}
      </div>
      <div className="@container relative">
        <div
          className={`relative aspect-[4/5] w-full overflow-hidden bg-panel lg:absolute lg:inset-0 lg:aspect-auto ${image.frameClassName ?? ""}`}
        >
          <motion.div
            className="split-opener-photo absolute inset-x-0 -top-[15%] bottom-0 lg:top-0"
            style={photoStyle}
          >
            {photo}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
