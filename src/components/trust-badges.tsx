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
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v1h6V7a3 3 0 0 0-3-3Zm0 8a2 2 0 1 0 .01 4.01A2 2 0 0 0 12 12Z"
        />
      </svg>
    ),
  },
] as const;

export function TrustBadges() {
  return (
    <section className="border-b border-off-white/10 bg-black">
      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-6">
        {trustBadges.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-3 text-off-white/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-baby-blue/30 text-baby-blue">
              {badge.icon}
            </span>
            <div>
              <p className="text-sm font-medium text-off-white">{badge.label}</p>
              <p className="text-xs text-off-white/55">{badge.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
