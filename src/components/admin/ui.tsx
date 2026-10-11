import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/*
  The admin's type scale: page title (serif), section heading (serif), label
  (small capitals), body. Spacing steps: 2rem between sections on phones,
  2.5rem from md; 1.25rem inside a card.
*/

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow ? <p className="admin-label">{eyebrow}</p> : null}
        <h1 className={`font-serif text-[2rem] leading-tight tracking-heading text-ink sm:text-[2.5rem] ${eyebrow ? "mt-2" : ""}`}>
          {title}
        </h1>
        {lede ? <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink/80">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({
  id,
  children,
  action,
}: {
  id?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-serif text-[1.5rem] leading-tight tracking-heading text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-admin-line bg-admin-surface ${className}`} {...props} />;
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60";

/** Blue Solution: the one primary action in a view. */
export const primaryButton = `${buttonBase} bg-brand text-white ring-1 ring-inset ring-white/15 hover:bg-traverse`;
/** Outlined: secondary actions, Call and Email. */
export const secondaryButton = `${buttonBase} border border-admin-edge text-ink hover:border-peak-fleet hover:bg-admin-raised`;
/** Text link in Peak Fleet. */
export const textLink =
  "rounded-sm text-sm font-bold text-peak-fleet underline-offset-4 transition-colors hover:text-ridge-cyan hover:underline";

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${textLink} -my-3 inline-flex min-h-11 items-center gap-1.5`}>
      {children}
      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5" />
      </svg>
    </Link>
  );
}

/** A calm empty state: a line drawing, one sentence, and optionally what to do next. */
export function EmptyState({
  illustration,
  title,
  children,
  action,
  className = "",
}: {
  illustration: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <div className="text-peak-fleet">{illustration}</div>
      <p className="mt-4 font-serif text-xl text-ink">{title}</p>
      {children ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink/80">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Loading placeholder; data-admin-skeleton tells the page transition the real page has not arrived. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div data-admin-skeleton aria-hidden className={`admin-skeleton ${className}`} />;
}

export function SkeletonPage({ children }: { children: ReactNode }) {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-72 max-w-full" />
      <div className="mt-8 space-y-6 md:mt-10">{children}</div>
    </div>
  );
}
