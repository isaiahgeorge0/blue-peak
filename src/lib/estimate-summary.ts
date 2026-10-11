import {
  ESTIMATOR_ADDONS,
  ESTIMATOR_FINISH_LABELS,
  ESTIMATOR_FINISH_MULT,
  ESTIMATOR_SIZE_LABELS,
  ESTIMATOR_SIZE_MULT,
  ESTIMATOR_START_OPTIONS,
  type EstimatorFinish,
  type EstimatorSize,
} from "./isometric-estimator-config.ts";
import { ESTIMATOR_SERVICE_TYPE } from "./lead-limits.ts";

/*
  The estimate an estimator lead built, read back from the message the
  estimator stores with the lead. The message comes from the visitor's
  browser, so nothing in it is shown as written: every value must be one of
  the estimator's own options, and the price and time on site must match what
  the estimator's pricing gives for those options. Anything else and there is
  no summary, so an email can never carry text a visitor typed in here.
*/

export type EstimateRow = { label: string; value: string };

/** The estimator's own caveat, worded for an email. */
export const ESTIMATE_CAVEAT = "These figures are estimates for scoping a conversation, not a fixed quote.";

/** Same sums as the estimator scene: total to the nearest £500, weeks as "N to N+2 weeks". */
export function estimatorFigures(addonKeys: string[], size: EstimatorSize, finish: EstimatorFinish) {
  const selected = ESTIMATOR_ADDONS.filter((addon) => addonKeys.includes(addon.key));
  const base = selected.reduce((sum, addon) => sum + addon.price, 0);
  const total = Math.round((base * ESTIMATOR_SIZE_MULT[size] * ESTIMATOR_FINISH_MULT[finish]) / 500) * 500;
  const weeks = Math.round((3 + selected.reduce((sum, addon) => sum + addon.weeks, 0)) * ESTIMATOR_SIZE_MULT[size]);
  return { total, weeks: `${weeks} to ${weeks + 2} weeks` };
}

export function formatPounds(value: number) {
  return `£${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function keyFor<K extends string>(labels: Record<K, string>, label: string | undefined): K | null {
  const match = (Object.entries(labels) as [K, string][]).find(([, text]) => text === label);
  return match ? match[0] : null;
}

/** The estimate as rows for an email, or null when the lead isn't from the estimator or anything doesn't check out. */
export function estimateFromLead(serviceType: string | null | undefined, message: string | null | undefined): EstimateRow[] | null {
  if (serviceType !== ESTIMATOR_SERVICE_TYPE || !message) return null;
  const fields = new Map<string, string>();
  for (const line of message.split(/\r?\n/)) {
    const at = line.indexOf(": ");
    if (at > 0) fields.set(line.slice(0, at).trim(), line.slice(at + 2).trim());
  }

  const workLabels = (fields.get("Work") ?? "").split(", ");
  const addons = workLabels.map((label) => ESTIMATOR_ADDONS.find((addon) => addon.label === label));
  if (addons.length === 0 || addons.some((addon) => !addon) || new Set(workLabels).size !== workLabels.length) return null;
  const size = keyFor(ESTIMATOR_SIZE_LABELS, fields.get("Size"));
  const finish = keyFor(ESTIMATOR_FINISH_LABELS, fields.get("Finish"));
  if (!size || !finish) return null;

  const figures = estimatorFigures(
    addons.map((addon) => addon!.key),
    size,
    finish,
  );
  const shownTotal = Number((fields.get("Estimated from") ?? "").replace(/^£/, "").replaceAll(",", ""));
  if (shownTotal !== figures.total || fields.get("Time on site") !== figures.weeks) return null;

  const rows: EstimateRow[] = [
    { label: "Work", value: workLabels.join(", ") },
    { label: "Size", value: ESTIMATOR_SIZE_LABELS[size] },
    { label: "Finish", value: ESTIMATOR_FINISH_LABELS[finish] },
    { label: "Estimated from", value: formatPounds(figures.total) },
    { label: "Time on site", value: figures.weeks },
  ];
  const start = fields.get("When would you like to start");
  if (start && (ESTIMATOR_START_OPTIONS as readonly string[]).includes(start)) rows.push({ label: "Start", value: start });
  return rows;
}
