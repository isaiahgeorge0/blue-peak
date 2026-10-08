import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  /**
   * Shows the eyebrow as a breadcrumb instead: the eyebrow links to `href`,
   * followed by the current page's name.
   */
  breadcrumb?: { href: string; current: string };
  /** The page's h1. */
  title: ReactNode;
  lede?: ReactNode;
  /** Buttons or links under the lede. */
  children?: ReactNode;
};

/**
 * Frost White band that opens an inner page. It runs up behind the floating
 * header, so its top padding includes the header's clearance.
 * Not wrapped in Reveal: it is above the fold and must paint without waiting
 * for hydration.
 */
export function PageHeader({
  eyebrow,
  breadcrumb,
  title,
  lede,
  children,
}: PageHeaderProps) {
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-6xl px-6 pt-38 pb-20 lg:pt-46 lg:pb-28">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 text-xs font-bold tracking-[0.2em] uppercase">
              <li>
                <Link
                  href={breadcrumb.href}
                  className="link-draw tap-target text-accent"
                >
                  {eyebrow}
                </Link>
              </li>
              <li aria-hidden className="text-ink/40">
                /
              </li>
              <li>
                <span aria-current="page" className="text-ink/70">
                  {breadcrumb.current}
                </span>
              </li>
            </ol>
          </nav>
        ) : (
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 max-w-4xl text-display-sm leading-display tracking-heading text-ink lg:text-7xl lg:tracking-display">
          {title}
        </h1>
        {lede ? (
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink/70">
            {lede}
          </p>
        ) : null}
        {children ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
