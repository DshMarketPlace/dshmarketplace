import assert from "node:assert/strict";
import { test } from "node:test";

import { readAllById } from "./paged";

const table = Array.from({ length: 45 }, (_, i) => ({ id: i * 2 + 1 }));
const pager = (calls: number[]) => async (after: number, size: number) => {
  calls.push(after);
  return table.filter((r) => r.id > after).slice(0, size);
};

test("reads every row across pages, in order", async () => {
  const calls: number[] = [];
  const rows = await readAllById(pager(calls), 10);
  assert.deepEqual(rows, table);
  assert.deepEqual(calls, [0, 19, 39, 59, 79]);
});

test("an exact multiple ends on one empty page", async () => {
  const calls: number[] = [];
  const rows = await readAllById(async (after, size) => {
    calls.push(after);
    return table.slice(0, 40).filter((r) => r.id > after).slice(0, size);
  }, 20);
  assert.equal(rows.length, 40);
  assert.equal(calls.length, 3);
});

test("an empty table is one call", async () => {
  assert.deepEqual(await readAllById(async () => [], 5), []);
});

test("a page that does not advance throws instead of looping", async () => {
  await assert.rejects(readAllById(async () => [{ id: 0 }], 1), /did not advance/);
});

test("rejects a nonsense page size", async () => {
  await assert.rejects(readAllById(async () => [], 0), /bad page size/);
});
