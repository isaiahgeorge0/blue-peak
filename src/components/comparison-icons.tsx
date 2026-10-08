import type { ReactNode } from "react";

/**
 * Line icons for the footer's distance comparisons, drawn on a 32 x 24 grid
 * for a 1.5px stroke at actual size. Same order as the comparisons list.
 */
export const comparisonIcons: ReactNode[] = [
  // Brick, a block in oblique view.
  <path key="brick" d="M4 11h20v8H4zM4 11l4-4h20l-4 4M24 19l4-4V7" />,
  // Worktop on a base unit.
  <path
    key="worktop"
    d="M3 8.5h26v3H3zM5 11.5v9.5h22v-9.5M16 11.5V21"
  />,
  // Door in its frame, standing on the floor.
  <path key="door" d="M7 21.5h18M10.5 21.5V3h11v18.5M18.5 11.5v2" />,
  // Floor to ceiling: an arrow between two lines.
  <path
    key="room"
    d="M4 2.75h24M4 21.25h24M16 6v12M13 9l3-3 3 3M13 15l3 3 3-3"
  />,
  // Scaffold board, with the metal bands at each end.
  <path key="board" d="M1.5 9.5h29v5h-29zM5 9.5v5M27 9.5v5" />,
  // Van, side on.
  <>
    <path
      key="body"
      d="M6.5 18.5H3V7a1 1 0 0 1 1-1h16l4.5 5H28a1.5 1.5 0 0 1 1.5 1.5v6h-3M11.5 18.5h10M20 6v5h4.5"
    />
    <circle key="rear" cx="9" cy="18.5" r="2.5" />
    <circle key="front" cx="24" cy="18.5" r="2.5" />
  </>,
  // Two-storey house; the roof rises 6.6 over a half-span of 11, a 31 degree pitch.
  <path
    key="house"
    d="M5 9.1 16 2.5l11 6.6M7.5 7.6v13.9h17V7.6M3.5 21.5h25M10.5 11h4v3.5h-4zM17.5 11h4v3.5h-4zM14.5 21.5V17h3v4.5"
  />,
  // Cricket stumps and bails.
  <path key="stumps" d="M12 7v14.5M16 7v14.5M20 7v14.5M12 5h3.5M16.5 5H20M8 21.5h16" />,
];
