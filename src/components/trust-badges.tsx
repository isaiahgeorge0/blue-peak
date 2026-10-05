/**
 * Only process facts the site already commits to elsewhere. Credentials
 * (insurance, guarantees, DBS, review scores) stay off until Blue Peak
 * confirms them.
 */
const trustBadges = [
  {
    label: "Written quotes",
    detail: "Before we start",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM8 13v2h8v-2H8Zm0 4v2h5v-2H8Z"
        />
      </svg>
    ),
  },
  {
    label: "Free site visits",
    detail: "To price it right",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="currentColor" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3Z" />
      </svg>
    ),
  },
  {
    label: "Friday photo updates",
    detail: "While on site",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        />
      </svg>
    ),
  },
  {
    label: "Based in Ipswich",
    detail: "Across Suffolk",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="currentColor"
          d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        />
      </svg>
    ),
  },
] as const;

/** Compact strip under the hero - continuation, not a new section. */
export function TrustBadges() {
  return (
    <div className="theme-brand bg-page">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:gap-x-8 sm:px-6 lg:flex lg:items-center lg:justify-between lg:gap-x-4 lg:py-3.5">
        {trustBadges.map((badge) => (
          <li
            key={badge.label}
            className="flex min-w-0 items-center gap-2 text-ink/75 lg:shrink-0"
          >
            <span className="shrink-0 text-accent">{badge.icon}</span>
            <span className="text-xs font-medium text-ink sm:text-sm lg:whitespace-nowrap">
              {badge.label}
            </span>
            <span className="hidden text-xs text-ink/75 md:inline">
              · {badge.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
