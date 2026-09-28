/**
 * Placeholder accreditation copy for a UK domestic builder.
 * Replace with verified insurance, guarantee terms, Google rating, and DBS
 * status before presenting as fact to clients.
 */
const trustBadges = [
  {
    label: "Fully insured",
    detail: "Public liability cover",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 2.2 6 2.2v4.7c0 3.9-2.5 7.4-6 8.9-3.5-1.5-6-5-6-8.9V6.4l6-2.2Z"
        />
      </svg>
    ),
  },
  {
    label: "10-year guarantee",
    detail: "On structural work",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a7 7 0 0 1 7 7c0 3.1-1.8 5.7-4.4 6.8L16 22H8l1.4-6.2A7 7 0 0 1 12 2Zm0 2a5 5 0 1 0 .01 10.01A5 5 0 0 0 12 4Z"
        />
      </svg>
    ),
  },
  {
    label: "Google rated",
    detail: "Local review score",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="m12 3.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.5 7.2 18.1l.9-5.4L4.2 8.9l5.4-.8L12 3.2Z"
        />
      </svg>
    ),
  },
  {
    label: "DBS checked",
    detail: "For work in the home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v1h6V7a3 3 0 0 0-3-3Zm0 8a2 2 0 1 0 .01 4.01A2 2 0 0 0 12 12Z"
        />
      </svg>
    ),
  },
] as const;

/** Compact strip under the hero — continuation, not a new section. */
export function TrustBadges() {
  return (
    <div className="border-b border-off-white/10 bg-black">
      <ul className="mx-auto flex max-w-6xl items-center gap-x-6 overflow-x-auto px-5 py-3 sm:gap-x-8 sm:px-6 sm:py-3.5 lg:justify-between lg:gap-x-4">
        {trustBadges.map((badge) => (
          <li
            key={badge.label}
            className="flex shrink-0 items-center gap-2 text-off-white/75"
          >
            <span className="text-baby-blue/90">{badge.icon}</span>
            <span className="text-xs font-medium whitespace-nowrap text-off-white sm:text-sm">
              {badge.label}
            </span>
            <span className="hidden text-xs text-off-white/45 md:inline">
              · {badge.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
