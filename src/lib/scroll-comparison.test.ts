import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { comparisons, measureUp, scrollSentence } from "./scroll-comparison.ts";

describe("footer distance comparison", () => {
  const rows: [number, string][] = [
    [0.03, "Not even half a brick yet"],
    [0.1, "about half a brick laid lengthways"],
    [0.22, "about one brick laid lengthways"],
    [0.45, "about two bricks laid lengthways"],
    [0.65, "about three bricks laid lengthways"],
    [0.9, "about a kitchen worktop's height"],
    [1.8, "about a standard door"],
    [2.4, "about floor to ceiling in most homes"],
    [5.2, "about the length of our van"],
    [15, "about two two-storey houses stacked up"],
    [41, "about two cricket pitches"],
  ];
  for (const [metres, expected] of rows) {
    test(`${metres}m: ${expected}`, () => {
      assert.equal(measureUp(metres).comparison, expected);
    });
  }

  test("outside 20% it says a bit more or less than the closest", () => {
    assert.equal(measureUp(0.17).comparison, "a bit less than one brick laid lengthways");
    assert.equal(measureUp(200).comparison, "a bit more than five cricket pitches");
  });

  test("under 8cm the sentence has no comparison and the tape heads for the brick", () => {
    assert.equal(scrollSentence(0.03), "You've scrolled 3 centimetres on this page. Not even half a brick yet.");
    assert.equal(measureUp(0.03).target, 0);
  });

  test("next up is the next milestone above, left out when the comparison is it", () => {
    assert.equal(
      scrollSentence(0.1),
      "You've scrolled 10 centimetres on this page. That's about half a brick laid lengthways. Next up: one brick laid lengthways.",
    );
    assert.equal(scrollSentence(0.2), "You've scrolled 20 centimetres on this page. That's about one brick laid lengthways.");
    assert.equal(measureUp(1.8).next, null);
    assert.equal(measureUp(1.8).target, 2);
    assert.equal(
      scrollSentence(3.1),
      "You've scrolled 3.1 metres on this page. That's about three kitchen worktops stacked up. Next up: a scaffold board.",
    );
    assert.equal(measureUp(3.1).target, 4);
    assert.equal(measureUp(41).next, null);
    assert.equal(measureUp(41).target, comparisons.length - 1);
  });
});
