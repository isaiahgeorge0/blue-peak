import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  children: ReactNode;
  className?: string;
  /** id for the h2, so a section can point aria-labelledby at it. */
  id?: string;
};

/** The serif h2 style, for sections that have no eyebrow. */
export const sectionTitleClassName =
  "text-4xl leading-tight tracking-tight text-ink lg:text-5xl";

/** Section heading: uppercase eyebrow, then the serif h2. */
export function SectionHeading({
  eyebrow,
  children,
  className = "",
  id,
}: SectionHeadingProps) {
  return (
    <div className={className}>
      <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">
        {eyebrow}
      </p>
      <h2 id={id} className={`mt-4 ${sectionTitleClassName}`}>
        {children}
      </h2>
    </div>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none ${className}`}
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 8h11m-4-4.5L14 8l-4.5 4.5"
      />
    </svg>
  );
}
