import { ESTIMATOR_ADDONS } from "./isometric-estimator-config.ts";

/*
  The pre-rendered house pictures in public/email/houses (made by
  scripts/render-email-images.mjs): one per combination of the six add-ons,
  named by the add-on keys in the estimator's order, or "none".
*/

export const HOUSE_IMAGE_DIR = "email/houses";
export const HOUSE_IMAGE_WIDTH = 1200;
export const HOUSE_IMAGE_HEIGHT = 900;

/** The email images by URL, for the admin preview (sent emails attach them instead). */
export function previewImageSources(houseFile: string | null) {
  return { logo: "/email/logo.png", gable: "/email/gable.png", house: houseFile ? `/${HOUSE_IMAGE_DIR}/${houseFile}` : null };
}

/** File name for a set of add-on keys. Callers pass known keys; see houseImageFor for checked input. */
export function houseImageName(keys: readonly string[]) {
  const ordered = ESTIMATOR_ADDONS.filter((addon) => keys.includes(addon.key)).map((addon) => addon.key);
  return `${ordered.length ? ordered.join("-") : "none"}.jpg`;
}

/** The picture for an estimate's add-ons, or null unless every key is a known add-on, listed once. */
export function houseImageFor(keys: readonly string[] | null | undefined): string | null {
  if (!keys) return null;
  const known = new Set(ESTIMATOR_ADDONS.map((addon) => addon.key));
  if (keys.some((key) => !known.has(key)) || new Set(keys).size !== keys.length) return null;
  return houseImageName(keys);
}
