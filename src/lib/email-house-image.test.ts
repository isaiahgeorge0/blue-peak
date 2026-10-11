import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { describe, test } from "node:test";
import { houseImageFor, houseImageName, HOUSE_IMAGE_DIR } from "./email-house-image.ts";
import { estimateFromLead, estimatorFigures, formatPounds } from "./estimate-summary.ts";
import { ESTIMATOR_ADDONS } from "./isometric-estimator-config.ts";

const KEYS = ESTIMATOR_ADDONS.map((addon) => addon.key);
const EVERY_COMBINATION = Array.from({ length: 2 ** KEYS.length }, (_, mask) => KEYS.filter((_, bit) => mask & (1 << bit)));

describe("house picture for an estimate", () => {
  test("named by the add-ons in the estimator's order, whatever order they were listed in", () => {
    assert.equal(houseImageName([]), "none.jpg");
    assert.equal(houseImageFor(["solar", "loft"]), "loft-solar.jpg");
    assert.equal(houseImageFor(["loft", "solar"]), "loft-solar.jpg");
    assert.equal(houseImageFor([...KEYS].reverse()), `${KEYS.join("-")}.jpg`);
  });

  test("nothing for unknown, repeated or missing keys", () => {
    assert.equal(houseImageFor(null), null);
    assert.equal(houseImageFor(undefined), null);
    assert.equal(houseImageFor(["loft", "pool"]), null);
    assert.equal(houseImageFor(["loft", "loft"]), null);
    assert.equal(houseImageFor(["../loft"]), null);
  });

  test("chosen from the checked estimate, never from the raw message", () => {
    const figures = estimatorFigures(["extension", "solar"], "standard", "quality");
    const message = (work: string, total = formatPounds(figures.total)) =>
      [
        "Site visit request from the quote calculator.",
        `Work: ${work}`,
        "Size: Standard",
        "Finish: Quality",
        `Estimated from: ${total}`,
        `Time on site: ${figures.weeks}`,
      ].join("\n");
    const pick = (text: string) => houseImageFor(estimateFromLead("quote-calculator", text)?.addonKeys);
    assert.equal(pick(message("Solar panels, Rear extension")), "extension-solar.jpg");
    assert.equal(pick(message("Solar panels, Rear extension", "£1")), null);
    assert.equal(pick(message("Solar panels, Rear extension, Moat")), null);
    assert.equal(pick(message("extension, solar")), null);
  });

  test("all 64 pictures are there, each under 80KB", () => {
    assert.equal(new Set(EVERY_COMBINATION.map(houseImageName)).size, 64);
    for (const keys of EVERY_COMBINATION) {
      const file = new URL(`../../public/${HOUSE_IMAGE_DIR}/${houseImageName(keys)}`, import.meta.url);
      const { size } = statSync(file);
      assert.ok(size > 0 && size < 80 * 1024, `${houseImageName(keys)}: ${size} bytes`);
    }
  });
});
