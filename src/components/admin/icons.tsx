import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

/** A 20 x 20 line icon, 1.5px stroke at actual size, in the current text colour. */
function icon(paths: ReactNode) {
  return function Icon({ className = "size-5", ...props }: IconProps) {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={`shrink-0 ${className}`}
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const DashboardIcon = icon(<path d="M3 3.5h5.5v6H3zM11.5 3.5H17v3.5h-5.5zM11.5 10H17v6.5h-5.5zM3 12.5h5.5v4H3z" />);
export const LeadsIcon = icon(<path d="M2.75 11.5 5 4.25h10l2.25 7.25v4.25H2.75zM2.75 11.5H7l1 2h4l1-2h4.25" />);
export const CalendarIcon = icon(<path d="M3 5h14v11.5H3zM3 8.5h14M6.5 3v3.5M13.5 3v3.5M6.5 11.5h2M11.5 11.5h2M6.5 14h2" />);
export const SubcontractorsIcon = icon(
  <path d="M4 16.5a4 4 0 0 1 8 0M8 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM13 5.25a2.5 2.5 0 0 1 0 4.5M14.5 12.75a4 4 0 0 1 2.5 3.75" />,
);
export const QuotesIcon = icon(<path d="M5 2.75h7l3 3v11.5H5zM12 2.75v3h3M7.5 9.5h5M7.5 12h5M7.5 14.5h3" />);
export const ReferralsIcon = icon(
  <path d="M6 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM14 17a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM6 7.5v2.25A3.25 3.25 0 0 0 9.25 13H11.5M10 11l1.75 2-1.75 2" />,
);
export const SeoIcon = icon(<path d="M10 17.25s-5-4.6-5-8.75a5 5 0 0 1 10 0c0 4.15-5 8.75-5 8.75ZM10 10.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />);
export const MoreIcon = icon(<path d="M4.5 10h.01M10 10h.01M15.5 10h.01" strokeWidth={2.5} />);
export const LogOutIcon = icon(<path d="M8 3.5H4.5v13H8M12 6.5l3.5 3.5-3.5 3.5M15.5 10H7.5" />);
export const PhoneIcon = icon(
  <path d="M5.5 3h2.25l1.25 3.5-1.75 1.25a8.5 8.5 0 0 0 5 5L13.5 11l3.5 1.25v2.25A2 2 0 0 1 15 16.5 12 12 0 0 1 3.5 5 2 2 0 0 1 5.5 3Z" />,
);
export const MailIcon = icon(<path d="M3 5h14v10H3zM3 5.5l7 5.5 7-5.5" />);
export const ArrowLeftIcon = icon(<path d="M16 10H4M8.5 5.5 4 10l4.5 4.5" />);
export const ArrowRightIcon = icon(<path d="M4 10h12M11.5 5.5 16 10l-4.5 4.5" />);
export const PlusIcon = icon(<path d="M10 4v12M4 10h12" />);
export const SearchIcon = icon(<path d="M8.75 14.5a5.75 5.75 0 1 0 0-11.5 5.75 5.75 0 0 0 0 11.5ZM13 13l4 4" />);
export const ChevronDownIcon = icon(<path d="m5.5 8 4.5 4.5L14.5 8" />);
export const ChevronLeftIcon = icon(<path d="M12 5.5 7.5 10l4.5 4.5" />);
export const ChevronRightIcon = icon(<path d="M8 5.5 12.5 10 8 14.5" />);
export const PanelIcon = icon(<path d="M3 4h14v12H3zM7.5 4v12" />);
export const CloseIcon = icon(<path d="m5 5 10 10M15 5 5 15" />);
export const AlertMailIcon = icon(<path d="M10.5 15H3V5h14v4.5M3 5.5l7 5.5 7-5.5M15.5 12v2.25M15.5 17h.01" />);
export const RepeatIcon = icon(<path d="M3.5 9V7.5a2 2 0 0 1 2-2h10l-2.5-2.5M16.5 11v1.5a2 2 0 0 1-2 2h-10l2.5 2.5" />);
export const NoteIcon = icon(<path d="M4 3.5h12v9l-4 4H4zM16 12.5h-4v4M7 7.5h6M7 10h4" />);
export const ClockIcon = icon(<path d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM10 6.5V10l2.5 1.5" />);
export const EditIcon = icon(<path d="M12.5 4.5l3 3-8.5 8.5H4v-3zM10.5 6.5l3 3" />);
export const TrashIcon = icon(<path d="M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.75 11h7.5l.75-11M8.5 8.5v5M11.5 8.5v5" />);

/* Status marks, drawn small beside the label so status never rests on colour alone. */
export const StatusNewIcon = icon(<circle cx="10" cy="10" r="3.5" fill="currentColor" stroke="none" />);
export const StatusContactedIcon = PhoneIcon;
export const StatusQuotedIcon = QuotesIcon;
export const StatusWonIcon = icon(<path d="m4.5 10.5 3.5 3.5 7.5-8" />);
export const StatusLostIcon = icon(<path d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM6.5 10h7" />);
export const StatusSpamIcon = icon(<path d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM5 5l10 10" />);

/**
 * Larger line drawings for empty states, on the 32 x 24 grid and stroke of
 * the footer's tape measure icons.
 */
function illustration(paths: ReactNode) {
  return function Illustration({ className = "h-12 w-16" }: { className?: string }) {
    return (
      <svg
        viewBox="0 0 32 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={className}
      >
        {paths}
      </svg>
    );
  };
}

/** A level, its bubble centred: all caught up. */
export const LevelIllustration = illustration(<path d="M3 9.5h26v6H3zM13 9.5v6M19 9.5v6M15 12.5h2" />);
/** A wall planner with one empty week. */
export const PlannerIllustration = illustration(<path d="M5 4.5h22v17H5zM5 9h22M10 2.5v4M22 2.5v4M9 13h3M14.5 13h3M20 13h3M9 17h3" />);
/** A spirit-level line rising: the weekly chart, still to come. */
export const ChartIllustration = illustration(<path d="M4 3v17.5h25M8 16.5l5-4 4 2.5 6-6.5 4 2.5" />);
/** A magnifier over a drawing sheet: nothing matches. */
export const SearchIllustration = illustration(<path d="M5 3.5h15v17H5zM8 8h9M8 11h5M19.5 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 17.5l4 4" />);
/** A notepad: no notes yet. */
export const NotepadIllustration = illustration(<path d="M8 3.5h16v18H8zM8 8h16M12 2v3M16 2v3M20 2v3M11.5 12h9M11.5 15.5h6" />);
