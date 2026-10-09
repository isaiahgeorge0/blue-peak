import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { areaPositions } from "./area-geo.ts";

describe("area distances from Ipswich", () => {
  const positions = areaPositions();
  const rows: [string, number, number][] = [
    ["ipswich", 0, 0],
    ["woodbridge", 7.4, 71],
    ["felixstowe", 10.6, 128],
    ["colchester", 15.8, 223],
  ];

  for (const [slug, miles, bearing] of rows) {
    test(`${slug}: ${miles} miles at ${bearing} degrees`, () => {
      assert.equal(Math.round(positions[slug].miles * 10) / 10, miles);
      assert.equal(Math.round(positions[slug].bearing), bearing);
    });
  }
});
