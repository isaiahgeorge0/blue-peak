"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { primaryCtaClassName } from "@/components/cta-styles";
import { SampleTag } from "@/components/sample-tag";
import { projects } from "@/lib/content";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";
import { remWide } from "@/lib/image-sizes";

const navLinks = [
  { href: "/", label: "Home", photo: "/home/hero.jpg" },
  { href: "/services", label: "Services", photo: "/services/kitchen-renovations.jpg" },
  { href: "/work", label: "Work", photo: "/work/colchester-internal-refurb/main.jpg" },
  { href: "/about", label: "About", photo: "/about/who-we-are.jpg" },
  { href: "/quote", label: "Estimate", photo: "/home/quote-preview.jpg" },
  { href: "/contact", label: "Contact", photo: "/home/after.jpg" },
];

const recentProjects = projects.slice(0, 3);

/** Scrolled less than this, the centre pill shows the inline links (from 72rem). */
const TOP_THRESHOLD = 80;
const WIDE_QUERY = "(min-width: 72rem)";

const pillClassName =
  "pointer-events-auto flex h-[var(--header-pill)] items-center rounded-full bg-peak-white text-ink shadow-lg ring-1 shadow-navy/20 ring-navy/5";

/** Shadow and hairline only; outer shadows are not drawn under a box, so the pieces need no fill. */
const pillShadowClassName = "shadow-lg ring-1 shadow-navy/20 ring-navy/5";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function subscribeNothing() {
  return () => {};
}

/**
 * Tracks whether the page is at the top (the centre pill shows the inline
 * links) and whether the side pills are hidden: below the first screen,
 * scrolling down hides them and scrolling up brings them back. Small
 * movements are ignored so they do not flicker. `ready` turns on transitions
 * once the first reading has been applied, so a reload part-way down a page
 * does not animate.
 */
function useHeaderScroll() {
  const [state, setState] = useState({ atTop: true, sidesHidden: false, ready: false });

  useEffect(() => {
    let lastY = window.scrollY;
    let hidden = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y <= window.innerHeight) hidden = false;
      else if (y > lastY + 4) hidden = true;
      else if (y < lastY - 4) hidden = false;
      if (Math.abs(y - lastY) > 4) lastY = y;
      const atTop = y < TOP_THRESHOLD;
      setState((previous) =>
        previous.atTop === atTop && previous.sidesHidden === hidden
          ? previous
          : { ...previous, atTop, sidesHidden: hidden },
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    let readyFrame = 0;
    frame = requestAnimationFrame(() => {
      update();
      readyFrame = requestAnimationFrame(() =>
        setState((previous) => ({ ...previous, ready: true })),
      );
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(readyFrame);
    };
  }, []);

  return state;
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 6.9 6.9l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5.5 1.5 1.5 0 0 1 5 4Z"
      />
    </svg>
  );
}

function NudgeArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 8h11M9 4l4 4-4 4"
      />
    </svg>
  );
}

/**
 * Floating header: a phone pill on the left, one pill at the centre, and Get
 * a quote on the right. At the top of a page on wide screens the centre pill
 * carries the wordmark and the inline links; otherwise it draws in to the
 * wordmark and the menu button, and opens into the menu panel. The header
 * itself ignores pointer events, so only the pills catch clicks and the page
 * between them stays clickable.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { atTop, sidesHidden, ready } = useHeaderScroll();
  const wideViewport = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedPath, setOpenedPath] = useState(pathname);
  const [photosMounted, setPhotosMounted] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const centreRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Back or forward while the menu is open closes it.
  if (menuOpen && openedPath !== pathname) setMenuOpen(false);

  const top = atTop && !menuOpen;
  const wide = top && wideViewport;

  const openMenu = () => {
    setOpenedPath(pathname);
    setPhotoIndex(null);
    setPhotosMounted(true);
    setMenuOpen(true);
  };

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Whichever of the inline links and the menu button is going away hands
  // focus to the one arriving, so focus is never left on a hidden control.
  // Runs before the browser moves focus off a control that has just become inert.
  useLayoutEffect(() => {
    if (!hydrated) return;
    const active = document.activeElement;
    if (!wide && active && linksRef.current?.contains(active)) {
      toggleRef.current?.focus({ preventScroll: true });
    } else if (wide && active === toggleRef.current) {
      const links = linksRef.current;
      (
        links?.querySelector<HTMLElement>('a[aria-current="page"]') ??
        links?.querySelector<HTMLElement>("a")
      )?.focus({ preventScroll: true });
    }
  }, [wide, hydrated]);

  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.overflow = "hidden";
    root.style.scrollbarGutter = "stable";

    // Everything outside the header (skip link, main, footer) is inert while
    // the menu is open, so neither Tab nor a screen reader can wander off.
    const outside = document.querySelectorAll<HTMLElement>("[data-menu-inert]");
    outside.forEach((element) => {
      element.inert = true;
    });

    surfaceRef.current
      ?.querySelector<HTMLElement>("nav a")
      ?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }
      if (event.key !== "Tab" || !centreRef.current) return;
      const focusable = Array.from(
        centreRef.current.querySelectorAll<HTMLElement>("a[href], button"),
      ).filter((element) => !element.closest("[inert]"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !centreRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !centreRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
      outside.forEach((element) => {
        element.inert = false;
      });
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  const sideState = menuOpen || sidesHidden
    ? "pointer-events-none invisible -translate-y-1 opacity-0"
    : "visible translate-y-0 opacity-100";

  const activeIndex = navLinks.findIndex((link) => isActive(pathname, link.href));
  const shownPhoto = photoIndex ?? Math.max(activeIndex, 0);

  return (
    <>
      <div
        aria-hidden
        onClick={() => closeMenu(true)}
        className={`fixed inset-0 z-40 bg-navy/35 transition-[opacity,visibility] ease-out motion-reduce:transition-none ${
          menuOpen
            ? "visible opacity-100 duration-350"
            : "invisible opacity-0 duration-250"
        }`}
      />

      <header
        data-top={top ? "true" : "false"}
        data-menu-open={menuOpen ? "true" : "false"}
        data-ready={ready ? "" : undefined}
        className="site-header pointer-events-none fixed inset-x-0 top-[var(--header-top)] z-50 [--panel-w:min(55rem,calc(100vw_-_2rem))]"
      >
        <div className="mx-auto grid max-w-[max(90rem,var(--container-6xl)+14rem)] grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 sm:px-6 lg:px-8">
          <div
            className={`site-header-side justify-self-start transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none ${sideState}`}
          >
            <a
              href={`tel:${sitePhoneTel}`}
              className={`${pillClassName} justify-center px-0 text-sm font-bold transition-colors duration-200 hover:text-accent max-md:w-[var(--header-pill)] md:px-5`}
            >
              <PhoneIcon className="h-5 w-5 md:hidden" />
              <span className="max-md:sr-only">
                <span className="sr-only">Call </span>
                {sitePhoneDisplay}
              </span>
            </a>
          </div>

          <div
            ref={centreRef}
            className="site-header-center relative h-[var(--header-pill)] w-[var(--pill-span)]"
          >
            <div
              aria-hidden
              className={`transition-opacity duration-200 ${menuOpen ? "opacity-0" : "opacity-100"}`}
            >
              <div className={`pill-cap pill-cap-l pill-shadow rounded-full ${pillShadowClassName}`} />
              <div className={`pill-cap pill-cap-r pill-shadow rounded-full ${pillShadowClassName}`} />
              <div className="pill-mid pill-shadow">
                <div className={`absolute inset-y-0 -inset-x-8 ${pillShadowClassName}`} />
              </div>
              <div className="pill-cap pill-cap-l pointer-events-auto rounded-full bg-peak-white" />
              <div className="pill-cap pill-cap-r pointer-events-auto rounded-full bg-peak-white" />
              <div className="pill-mid pointer-events-auto bg-peak-white" />
            </div>

            <div
              id={menuId}
              ref={surfaceRef}
              data-open={menuOpen ? "true" : "false"}
              className="menu-surface pointer-events-auto absolute top-0 left-1/2 max-h-[calc(100dvh_-_2*var(--header-top))] w-[var(--panel-w)] -translate-x-1/2 overflow-y-auto overscroll-contain bg-peak-white"
            >
              <div aria-hidden className="sticky top-0 z-10 h-[var(--header-pill)] bg-peak-white" />
              <div
                inert={!menuOpen}
                className={`px-6 pt-5 pb-6 sm:px-10 sm:pt-6 sm:pb-8 ${
                  menuOpen ? "visible" : "invisible transition-[visibility] delay-250"
                }`}
              >
                <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
                  <nav aria-label="Menu">
                    <ul className="group/menu">
                      {navLinks.map((link, index) => {
                        const active = index === activeIndex;
                        return (
                          <li
                            key={link.href}
                            className={`transition-[opacity,translate] ease-out motion-reduce:transition-none ${
                              menuOpen
                                ? "translate-y-0 opacity-100 duration-500"
                                : "translate-y-3 opacity-0 duration-150"
                            }`}
                            style={
                              {
                                transitionDelay: menuOpen ? `${90 + index * 30}ms` : "0ms",
                              } as CSSProperties
                            }
                          >
                            <Link
                              href={link.href}
                              onClick={() => closeMenu()}
                              onMouseEnter={() => setPhotoIndex(index)}
                              onFocus={() => setPhotoIndex(index)}
                              aria-current={active ? "page" : undefined}
                              className={`group/link relative inline-flex rounded-sm py-[0.3rem] font-serif text-[2.125rem] leading-[1.05] tracking-heading transition-[opacity,color] duration-200 ease-out group-has-[a:hover]/menu:opacity-40 group-has-[a:focus-visible]/menu:opacity-40 hover:opacity-100! focus-visible:opacity-100! sm:py-0.5 sm:text-[2.75rem] ${
                                active ? "text-accent" : "text-ink"
                              }`}
                            >
                              <NudgeArrow className="absolute top-1/2 -left-2.5 h-[0.45em] w-[0.45em] -translate-x-2 -translate-y-1/2 opacity-0 transition-[opacity,translate] duration-200 ease-out group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100 motion-reduce:transition-none" />
                              <span className="inline-block transition-transform duration-200 ease-out group-hover/link:translate-x-3 group-focus-visible/link:translate-x-3 motion-reduce:transition-none">
                                {link.label}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>

                  <div
                    aria-hidden
                    className={`relative hidden aspect-[5/6] w-[18.75rem] shrink-0 overflow-hidden rounded-xl bg-frost transition-[opacity,translate] ease-out motion-reduce:transition-none lg:block ${
                      menuOpen
                        ? "translate-y-0 opacity-100 delay-[150ms] duration-500"
                        : "translate-y-3 opacity-0 duration-150"
                    }`}
                  >
                    {photosMounted
                      ? navLinks.map((link, index) => (
                          <Image
                            key={link.href}
                            src={link.photo}
                            alt=""
                            fill
                            loading="eager"
                            sizes={`${remWide(300)}, 300px`}
                            className={`object-cover transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                              index === shownPhoto ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        ))
                      : null}
                  </div>
                </div>

                <div
                  className={`mt-6 border-t border-ink/10 pt-5 transition-[opacity,translate] ease-out motion-reduce:transition-none sm:mt-8 sm:pt-6 ${
                    menuOpen
                      ? "translate-y-0 opacity-100 delay-[270ms] duration-500"
                      : "translate-y-3 opacity-0 duration-150"
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-ink/70 uppercase">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Recent work
                  </p>
                  <ul className="-mx-6 mt-3 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:mt-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
                    {recentProjects.map((project) => (
                      <li key={project.slug} className="w-[62%] shrink-0 snap-start sm:w-auto">
                        <Link
                          href={`/work/${project.slug}`}
                          onClick={() => closeMenu()}
                          className="group/card block rounded-md"
                        >
                          <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-ink/10">
                            <Image
                              src={project.image}
                              alt=""
                              fill
                              sizes={`${remWide(250)}, (max-width: 640px) 60vw, 250px`}
                              className="object-cover transition-transform duration-300 ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none"
                            />
                            {project.sample ? (
                              <SampleTag overPhoto className="absolute top-2 left-2" />
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-ink transition-colors duration-200 group-hover/card:text-accent">
                            {project.title}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 transition-opacity ease-out motion-reduce:transition-none sm:mt-7 ${
                    menuOpen ? "opacity-100 delay-[320ms] duration-500" : "opacity-0 duration-150"
                  }`}
                >
                  <a
                    href={`tel:${sitePhoneTel}`}
                    className="link-draw tap-target text-base font-bold text-ink transition-colors hover:text-accent"
                  >
                    <span className="sr-only">Call </span>
                    {sitePhoneDisplay}
                  </a>
                  <Link
                    href="/contact"
                    onClick={() => closeMenu()}
                    className={primaryCtaClassName}
                  >
                    <span className="cta-label">Get a quote</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center pr-1.5 pl-4">
              <Link
                href="/"
                onClick={() => closeMenu()}
                aria-label="Blue Peak, home"
                data-open={menuOpen ? "true" : "false"}
                className="pill-wordmark tap-target pointer-events-auto relative flex shrink-0 items-center rounded-full text-brand transition-colors hover:text-traverse"
              >
                <BrandWordmark title="" className="h-4 w-auto sm:h-5" />
              </Link>

              <div ref={linksRef} className="pill-links ml-4 flex h-full min-w-0 flex-1 items-center overflow-hidden">
                <nav
                  aria-label="Main"
                  inert={hydrated && !wide}
                  className="pill-links-track flex w-full items-center justify-between"
                >
                  {navLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={index === activeIndex ? "page" : undefined}
                      className={`tap-target pointer-events-auto relative rounded-full px-2.5 py-1.5 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-200 hover:text-accent ${
                        index === activeIndex ? "text-accent" : "text-ink"
                      }`}
                    >
                      <span className="link-draw">{link.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <button
                ref={toggleRef}
                type="button"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
                data-open={menuOpen ? "true" : "false"}
                inert={hydrated && wide}
                className="pill-toggle tap-target pointer-events-auto absolute inset-y-0 my-auto flex h-10 w-10 items-center justify-center rounded-full text-brand hover:text-traverse"
              >
                <span aria-hidden className="relative block h-3 w-5">
                  <span
                    className={`absolute top-0 left-0 h-0.5 w-5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out motion-reduce:transition-none ${
                      menuOpen ? "translate-y-[5px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute top-[10px] left-0 h-0.5 w-5 rounded-full bg-current transition-[translate,rotate] duration-300 ease-out motion-reduce:transition-none ${
                      menuOpen ? "-translate-y-[5px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div
            className={`site-header-side justify-self-end transition-[opacity,translate,visibility] duration-200 ease-out max-md:hidden motion-reduce:transition-none ${sideState}`}
          >
            <Link
              href="/contact"
              className="group pointer-events-auto flex h-[var(--header-pill)] items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent shadow-lg ring-1 shadow-navy/20 ring-peak-white/60 transition-colors duration-200 hover:bg-traverse"
            >
              Get a quote
              <NudgeArrow className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
