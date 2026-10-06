/** Tick for checklist items; sits on the first line of the text beside it. */
export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-1 h-4 w-4 shrink-0 text-accent"
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8.5 6.5 12 13 4.5"
      />
    </svg>
  );
}
