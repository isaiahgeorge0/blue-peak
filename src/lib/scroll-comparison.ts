/** 1 CSS pixel is 1/96 inch: 0.2646mm. */
export const METRES_PER_PX = 0.0002646;

type Comparison = {
  metres: number;
  one: string;
  many: (n: string) => string;
  /** Only for things that read naturally halved. */
  half?: string;
};

/**
 * Real measurements only, shortest first; these are also the tape's
 * milestones. Same order as the footer's comparison icons.
 */
export const comparisons: Comparison[] = [
  {
    metres: 0.215,
    one: "one brick laid lengthways",
    many: (n) => `${n} bricks laid lengthways`,
    half: "half a brick laid lengthways",
  },
  {
    metres: 0.9,
    one: "a kitchen worktop's height",
    many: (n) => `${n} kitchen worktops stacked up`,
  },
  {
    metres: 1.981,
    one: "a standard door",
    many: (n) => `${n} standard doors`,
    half: "half a standard door",
  },
  {
    metres: 2.4,
    one: "floor to ceiling in most homes",
    many: (n) => `${n} times floor to ceiling in most homes`,
  },
  {
    metres: 3.9,
    one: "a scaffold board",
    many: (n) => `${n} scaffold boards`,
    half: "half a scaffold board",
  },
  {
    metres: 5,
    one: "the length of our van",
    many: (n) => `${n} lengths of our van`,
  },
  {
    metres: 7.5,
    one: "the height of a two-storey house",
    many: (n) => `${n} two-storey houses stacked up`,
  },
  {
    metres: 20,
    one: "a cricket pitch",
    many: (n) => `${n} cricket pitches`,
  },
];

const MULTIPLES = [0.5, 1, 2, 3, 4, 5];
const MULTIPLE_WORDS: Record<number, string> = { 2: "two", 3: "three", 4: "four", 5: "five" };
/** A single item this close wins outright, even over a closer multiple. */
const SINGLE_WINS_WITHIN = 0.12;
/** Closer than this, it's "about"; otherwise "a bit more/less than". */
const ABOUT_WITHIN = 0.2;
/** Below this there's nothing sensible to compare with yet. */
const NOT_YET_BELOW = 0.08;

type Candidate = { index: number; multiple: number; metres: number; off: number; text: string };

function candidates(metres: number): Candidate[] {
  const list: Candidate[] = [];
  comparisons.forEach((item, index) => {
    for (const multiple of MULTIPLES) {
      if (multiple === 0.5 && !item.half) continue;
      const length = item.metres * multiple;
      const text =
        multiple === 0.5 ? item.half! : multiple === 1 ? item.one : item.many(MULTIPLE_WORDS[multiple]);
      list.push({ index, multiple, metres: length, off: Math.abs(length - metres) / metres, text });
    }
  });
  return list;
}

/** Closest first; on a tie the smaller multiple, then the shorter item. */
function closest(list: Candidate[]) {
  return list.reduce((best, c) =>
    c.off < best.off || (c.off === best.off && c.multiple < best.multiple) ? c : best,
  );
}

export type Measure = {
  /** The comparison as the sentence words it, without "That's" or the full stop. */
  comparison: string;
  /** The next milestone above the distance, unless the comparison already is it. */
  next: string | null;
  /** Index of the milestone the tape runs towards (and whose icon shows). */
  target: number;
  /** How far the tape is between the previous milestone and the target, 0 to 1. */
  progress: number;
};

export function measureUp(metres: number): Measure {
  const last = comparisons.length - 1;
  const above = comparisons.findIndex((item) => item.metres > metres);
  const target = above === -1 ? last : above;
  const from = target === 0 ? 0 : comparisons[target - 1].metres;
  const progress = above === -1 ? 1 : (metres - from) / (comparisons[target].metres - from);

  if (metres < NOT_YET_BELOW) {
    return { comparison: "Not even half a brick yet", next: null, target, progress };
  }

  const list = candidates(metres);
  const singles = list.filter((c) => c.multiple === 1 && c.off <= SINGLE_WINS_WITHIN);
  const pick = closest(singles.length ? singles : list);
  const comparison =
    pick.off <= ABOUT_WITHIN
      ? `about ${pick.text}`
      : `${pick.metres > metres ? "a bit less than" : "a bit more than"} ${pick.text}`;
  const isNext = above !== -1 && pick.index === target && pick.multiple === 1;

  return {
    comparison,
    next: above === -1 || isNext ? null : comparisons[target].one,
    target,
    progress,
  };
}

export function formatDistance(metres: number) {
  if (metres < 1) {
    const cm = Math.round(metres * 100);
    return `${cm} ${cm === 1 ? "centimetre" : "centimetres"}`;
  }
  return `${metres.toFixed(1)} metres`;
}

/** The whole footer line, as one string. */
export function scrollSentence(metres: number) {
  const { comparison, next } = measureUp(metres);
  const body = metres < NOT_YET_BELOW ? `${comparison}.` : `That's ${comparison}.`;
  return `You've scrolled ${formatDistance(metres)} on this page. ${body}${next ? ` Next up: ${next}.` : ""}`;
}
