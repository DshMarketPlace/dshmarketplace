import assert from "node:assert/strict";
import test from "node:test";
import { isWeeklyDue } from "./weekly-due";

test("the first issue is due as soon as there is a snapshot", () => {
  assert.equal(isWeeklyDue("2026-10-27", null), true);
});

test("nothing is due without a snapshot to end the week on", () => {
  assert.equal(isWeeklyDue(null, null), false);
  assert.equal(isWeeklyDue(null, "2026-10-20"), false);
});

test("due at seven days, not at six", () => {
  assert.equal(isWeeklyDue("2026-10-26", "2026-10-20"), false);
  assert.equal(isWeeklyDue("2026-10-27", "2026-10-20"), true);
  assert.equal(isWeeklyDue("2026-10-30", "2026-10-20"), true);
});

test("a rerun on the night an issue was written is not due again", () => {
  assert.equal(isWeeklyDue("2026-10-27", "2026-10-27"), false);
});

test("counts calendar days across a month and a year boundary", () => {
  assert.equal(isWeeklyDue("2026-11-03", "2026-10-27"), true);
  assert.equal(isWeeklyDue("2027-01-02", "2026-12-27"), false);
  assert.equal(isWeeklyDue("2027-01-03", "2026-12-27"), true);
});

test("a malformed day throws instead of reading as due", () => {
  assert.throws(() => isWeeklyDue("2026-10-27", "27/10/2026"));
  assert.throws(() => isWeeklyDue("2026-13-40", "2026-10-20"));
});
