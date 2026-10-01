/**
 * Placeholder pricing for the isometric quote calculator.
 * Wire real Blue Peak figures here later without touching the 3D scene.
 */

export type EstimatorAddon = {
  key: string;
  label: string;
  price: number;
  weeks: number;
  color: string;
};

export const ESTIMATOR_ADDONS: EstimatorAddon[] = [
  {
    key: "loft",
    label: "Loft conversion",
    price: 45000,
    weeks: 5,
    color: "#89cff0",
  },
  {
    key: "extension",
    label: "Rear extension",
    price: 58000,
    weeks: 6,
    color: "#e0a15c",
  },
  {
    key: "side_return",
    label: "Side return",
    price: 28000,
    weeks: 3,
    color: "#8fbf7a",
  },
  {
    key: "garden_room",
    label: "Garden room",
    price: 24000,
    weeks: 3,
    color: "#c98fd9",
  },
  {
    key: "solar",
    label: "Solar panels",
    price: 9000,
    weeks: 1,
    color: "#f0d05c",
  },
  {
    key: "kitchen_bath",
    label: "Kitchen or bathroom",
    price: 32000,
    weeks: 4,
    color: "#f08f8f",
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
