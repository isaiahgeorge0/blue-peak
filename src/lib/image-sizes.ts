/*
  `sizes` entries for screens 1440px and wider, where the root font size and
  the main container grow (see "Large screens" in globals.css). Put them first
  in a sizes list; below 1440 the existing entries apply unchanged. Rems can't
  be used in `sizes`, so the growth is written out in vw and px.
*/

/** A box `px` wide at 1440 that grows with the main container. */
export function containerWide(px: number) {
  const at2560 = Math.round((px * 1888) / 1152);
  const vw = ((px * 65.7) / 1152).toFixed(2);
  const fixed = Math.round((px * 205.7) / 1152);
  return `(min-width: 2560px) ${at2560}px, (min-width: 1440px) calc(${vw}vw + ${fixed}px)`;
}

/** A box `px` wide at 1440 that grows with the root font size only. */
export function remWide(px: number) {
  const vw = (px * 0.02231).toFixed(2);
  const fixed = Math.round(px * 0.6786);
  return `(min-width: 2560px) ${Math.round(px * 1.25)}px, (min-width: 1440px) calc(${vw}vw + ${fixed}px)`;
}
