import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  /** The page's h1. */
  title: ReactNode;
  lede?: ReactNode;
  /** Buttons or links under the lede. */
  children?: ReactNode;
};

/**
 * Frost White band that opens an inner page, directly under the site header.
 * Not wrapped in Reveal: it is above the fold and must paint without waiting
 * for hydration.
 */
export function PageHeader({ eyebrow, title, lede, children }: PageHeaderProps) {
  return (
    <section className="bg-panel">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-tight tracking-tight text-ink lg:text-6xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70">
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
