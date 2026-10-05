/**
 * Placeholder pricing for the isometric quote calculator.
 * Wire real Blue Peak figures here later without touching the 3D scene.
 */

export type EstimatorAddon = {
  key: string;
  label: string;
  price: number;
  weeks: number;
  /** CSS colour for the cost bar and legend. Every add-on uses Peak Fleet. */
  color: string;
};

const ADDON_COLOR = "var(--peak-fleet)";

export const ESTIMATOR_ADDONS: EstimatorAddon[] = [
  {
    key: "loft",
    label: "Loft conversion",
    price: 45000,
    weeks: 5,
    color: ADDON_COLOR,
  },
  {
    key: "extension",
    label: "Rear extension",
    price: 58000,
    weeks: 6,
    color: ADDON_COLOR,
  },
  {
    key: "side_return",
    label: "Side return",
    price: 28000,
    weeks: 3,
    color: ADDON_COLOR,
  },
  {
    key: "garden_room",
    label: "Garden room",
    price: 24000,
    weeks: 3,
    color: ADDON_COLOR,
  },
  {
    key: "solar",
    label: "Solar panels",
    price: 9000,
    weeks: 1,
    color: ADDON_COLOR,
  },
  {
    key: "kitchen_bath",
    label: "Kitchen or bathroom",
    price: 32000,
    weeks: 4,
    color: ADDON_COLOR,
  },
];

export const ESTIMATOR_SIZE_MULT = {
  compact: 0.86,
  standard: 1,
  large: 1.35,
} as const;

export const ESTIMATOR_FINISH_MULT = {
  simple: 0.9,
  quality: 1,
  highend: 1.25,
} as const;

export type EstimatorSize = keyof typeof ESTIMATOR_SIZE_MULT;
export type EstimatorFinish = keyof typeof ESTIMATOR_FINISH_MULT;

export const ESTIMATOR_SIZE_LABELS: Record<EstimatorSize, string> = {
  compact: "Compact",
  standard: "Standard",
  large: "Large",
};

export const ESTIMATOR_FINISH_LABELS: Record<EstimatorFinish, string> = {
  simple: "Simple",
  quality: "Quality",
  highend: "High-end",
};

export const ESTIMATOR_START_OPTIONS = [
  "As soon as possible",
  "Within 3 months",
  "3 to 6 months",
  "Just exploring",
] as const;

/** What the visitor has chosen; owned by the funnel and pushed into the scene. */
export type EstimatorSelection = {
  addons: string[];
  size: EstimatorSize;
  finish: EstimatorFinish;
};

/** Current calculator selection, reported by the scene after each change. */
export type EstimateSummary = {
  work: string[];
  size: EstimatorSize;
  finish: EstimatorFinish;
  /** Rounded total in pounds, or null when nothing is selected. */
  total: number | null;
  weeks: string | null;
};

export type EstimatorConfig = {
  addons: EstimatorAddon[];
  sizeMult: typeof ESTIMATOR_SIZE_MULT;
  finishMult: typeof ESTIMATOR_FINISH_MULT;
};

export const defaultEstimatorConfig: EstimatorConfig = {
  addons: ESTIMATOR_ADDONS,
  sizeMult: ESTIMATOR_SIZE_MULT,
  finishMult: ESTIMATOR_FINISH_MULT,
};
