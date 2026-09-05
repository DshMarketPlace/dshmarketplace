import assert from "node:assert/strict";
import test from "node:test";
import { parseRegistryEntry } from "./registry";
import { correctedSummary } from "./summary-corrections";

test("repeated imports cannot overwrite reviewed bilingual copy with old registry text", () => {
  const raw = `url: https://github.com/moguiyu/dsh-tavily/tree/main/packages/dsh-tavily
name: moguiyu/dsh-tavily#packages/dsh-tavily
category: browser
description:
  en: Old summary.
  zh: 旧简介。
`;
  for (let i = 0; i < 2; i++) {
    const entry = parseRegistryEntry(raw)!;
    assert.match(entry.summary!, /extract, map, and crawl/);
    assert.match(entry.summaryZh!, /内容提取/);
    assert.deepEqual(correctedSummary(entry.fullName), {
      summary: entry.summary, summaryZh: entry.summaryZh,
    });
  }
});

test("corrections distinguish subpackages and leave unrelated listings alone", () => {
  assert.match(correctedSummary("moguiyu/dsh-tavily#packages/dsh-tool-tavily-search").summary!, /No settings card/);
  assert.deepEqual(correctedSummary("other/dsh-tavily"), {});
  assert.deepEqual(correctedSummary("moguiyu/dsh-tavily"), {});
});
