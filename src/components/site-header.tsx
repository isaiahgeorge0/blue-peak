"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { BrandWordmark } from "@/components/brand/brand-logo";
import { primaryCtaClassName } from "@/components/cta-styles";
import { SampleTag } from "@/components/sample-tag";
import { projects } from "@/lib/content";
import { sitePhoneDisplay, sitePhoneTel } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/quote", label: "Estimate" },
  { href: "/contact", label: "Contact" },
];

const recentProjects = projects.slice(0, 3);

const pillClassName =
  "pointer-events-auto flex h-[var(--header-pill)] items-center rounded-full bg-peak-white text-ink shadow-lg ring-1 shadow-navy/20 ring-navy/5";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Below the first screen, scrolling down hides the side pills and scrolling up
 * brings them back. Small movements are ignored so they do not flicker.
 */
function useSidesHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y <= window.innerHeight) setHidden(false);
      else if (y > lastY + 4) setHidden(true);
      else if (y < lastY - 4) setHidden(false);
      if (Math.abs(y - lastY) > 4) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return hidden;
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
 * Floating header: a phone pill on the left, the wordmark and menu button in
 * one pill at the centre, and Get a quote on the right. The centre pill opens
 * into the menu panel. The header itself ignores pointer events, so only the
 * pills catch clicks and the page between them stays clickable.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const sidesHidden = useSidesHidden();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedPath, setOpenedPath] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const centreRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Back or forward while the menu is open closes it.
  if (menuOpen && openedPath !== pathname) setMenuOpen(false);

  const openMenu = () => {
    setOpenedPath(pathname);
    setMenuOpen(true);
  };

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

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
        className="site-header pointer-events-none fixed inset-x-0 top-[var(--header-top)] z-50 [--panel-w:min(55rem,calc(100vw_-_2rem))] [--pill-w:11.75rem] sm:[--pill-w:13.75rem]"
      >
        <div className="mx-auto grid max-w-[90rem] grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 sm:px-6 lg:px-8">
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
            className="site-header-center pointer-events-auto relative h-[var(--header-pill)] w-[var(--pill-w)]"
          >
            <div
              aria-hidden
              className={`absolute inset-0 rounded-full shadow-lg ring-1 shadow-navy/20 ring-navy/5 transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />

            <div
              id={menuId}
              ref={surfaceRef}
              data-open={menuOpen ? "true" : "false"}
              className="menu-surface absolute top-0 left-1/2 max-h-[calc(100dvh_-_2*var(--header-top))] w-[var(--panel-w)] -translate-x-1/2 overflow-y-auto overscroll-contain bg-peak-white"
            >
              <div aria-hidden className="sticky top-0 z-10 h-[var(--header-pill)] bg-peak-white" />
              <div
                inert={!menuOpen}
                className={`px-6 pt-5 pb-6 sm:px-10 sm:pt-6 sm:pb-8 ${
                  menuOpen ? "visible" : "invisible transition-[visibility] delay-250"
                }`}
              >
                <nav aria-label="Menu">
                  <ul className="group/menu">
                    {navLinks.map((link, index) => {
                      const active = isActive(pathname, link.href);
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
                            aria-current={active ? "page" : undefined}
                            className={`group/link relative inline-flex rounded-sm py-0.5 font-serif text-[2.125rem] leading-[1.05] tracking-heading transition-[opacity,color] duration-200 ease-out group-has-[a:hover]/menu:opacity-40 group-has-[a:focus-visible]/menu:opacity-40 hover:opacity-100! focus-visible:opacity-100! sm:text-[2.75rem] ${
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
                              sizes="(max-width: 640px) 60vw, 250px"
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
                    className="link-draw text-base font-bold text-ink transition-colors hover:text-accent"
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

            <div className="absolute inset-0 flex items-center justify-between pr-0.5 pl-4">
              <Link
                href="/"
                onClick={() => closeMenu()}
                aria-label="Blue Peak, home"
                className="flex items-center rounded-full text-brand transition-[color,translate] duration-250 ease-out hover:text-traverse motion-reduce:transition-none data-[open=true]:translate-x-[calc((var(--pill-w)_-_var(--panel-w))/2_+_0.5rem)] data-[open=true]:duration-350 sm:data-[open=true]:translate-x-[calc((var(--pill-w)_-_var(--panel-w))/2_+_1.5rem)]"
                data-open={menuOpen ? "true" : "false"}
              >
                <BrandWordmark title="" className="h-4 w-auto sm:h-5" />
              </Link>

              <button
                ref={toggleRef}
                type="button"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
                data-open={menuOpen ? "true" : "false"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-brand transition-[color,translate] duration-250 ease-out hover:text-traverse motion-reduce:transition-none data-[open=true]:translate-x-[calc((var(--panel-w)_-_var(--pill-w))/2_-_0.75rem)] data-[open=true]:duration-350 sm:data-[open=true]:translate-x-[calc((var(--panel-w)_-_var(--pill-w))/2_-_1.75rem)]"
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
