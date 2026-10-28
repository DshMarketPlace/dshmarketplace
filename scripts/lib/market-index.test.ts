import assert from "node:assert/strict";
import test from "node:test";

import { buildMarketIndex, compareVersions, recommendedScore } from "../../lib/market";

type Data = Parameters<typeof buildMarketIndex>[0];
type Row = Data["rows"][number];

const release = (name: string, engines: string | null = null) =>
  JSON.stringify({ name, version: "1.2.3", publishedAt: 1790000000, engines });

function row(over: Partial<Row> & { id: number; fullName: string }): Row {
  return {
    name: over.fullName.split("/")[1],
    owner: over.fullName.split("/")[0],
    subpath: null,
    repoUrl: `https://github.com/${over.fullName}`,
    summary: "does things",
    summaryZh: "做事",
    categoryId: null,
    slug: over.fullName.replace("/", "-"),
    visibility: "hidden",
    stars: 10,
    installCount: 0,
    inRegistry: false,
    linuxdoUrl: null,
    installStatus: "passed",
    installDshVersion: "0.2.1-rc.2",
    verifiedRelease: release(`pkg-${over.id}`),
    ...over,
  } as Row;
}

const data = (rows: Row[], extra: Partial<Data> = {}): Data => ({
  rows,
  categories: [],
  weekGain: [],
  previews: [],
  ...extra,
});

test("homepage is our page for a listed plugin and the repository otherwise", () => {
  const index = buildMarketIndex(
    data([
      row({ id: 1, fullName: "a/one", visibility: "indexed", slug: "a-one" }),
      row({ id: 2, fullName: "b/two", visibility: "listed", slug: "b-two" }),
      row({ id: 3, fullName: "c/three", visibility: "hidden" }),
    ]),
  );
  const home = Object.fromEntries(index.plugins.map((p) => [p.name, p.homepage]));
  assert.equal(home["pkg-1"], "https://dshmarketplace.dev/plugins/a-one");
  assert.equal(home["pkg-2"], "https://dshmarketplace.dev/plugins/b-two");
  assert.equal(home["pkg-3"], "https://github.com/c/three");
});

test("every entry names the dsh its release installed on, and each label is declared", () => {
  const index = buildMarketIndex(
    data([
      row({ id: 1, fullName: "a/one", installDshVersion: "0.2.1-rc.2" }),
      row({ id: 2, fullName: "b/two", installDshVersion: "0.2.0-rc.2", installStatus: "incompatible" }),
    ]),
  );
  const labels = Object.fromEntries(index.plugins.map((p) => [p.name, p.metadata.labels]));
  assert.deepEqual(labels["pkg-1"], ["sandbox-0.2.1-rc.2"]);
  assert.deepEqual(labels["pkg-2"], ["sandbox-0.2.0-rc.2", "older-release"]);
  // Newest dsh first in the Labels menu; nothing declared that no entry uses.
  assert.deepEqual(Object.keys(index.metadata.labels), ["sandbox-0.2.1-rc.2", "sandbox-0.2.0-rc.2", "older-release"]);
  assert.equal(index.metadata.labels["sandbox-0.2.1-rc.2"].title.en, "Sandbox-installed on dsh 0.2.1-rc.2");
  for (const p of index.plugins) for (const l of p.metadata.labels) assert.ok(l in index.metadata.labels, l);
});

test("preview verdicts label only a pass or a gate refusal on the tag's release", () => {
  const index = buildMarketIndex(
    data(
      [
        row({ id: 1, fullName: "a/one" }),
        row({ id: 2, fullName: "b/two" }),
        row({ id: 3, fullName: "c/three" }),
      ],
      {
        previews: [
          {
            tag: "alpha",
            version: "0.2.2-alpha.2",
            verdicts: { "a/one": "passed", "b/two": "incompatible", "c/three": "failed" },
          },
        ],
      },
    ),
  );
  const labels = Object.fromEntries(index.plugins.map((p) => [p.name, p.metadata.labels]));
  assert.ok(labels["pkg-1"].includes("alpha-ok"));
  assert.ok(labels["pkg-2"].includes("alpha-refused"));
  assert.deepEqual(labels["pkg-3"], ["sandbox-0.2.1-rc.2"]);
  assert.equal(index.metadata.labels["alpha-ok"].title.en, "Also installs on dsh 0.2.2-alpha.2 (alpha)");
  assert.equal(index.metadata.labels["alpha-refused"].title.zh, "dsh 0.2.2-alpha.2（alpha）拒装");
});

test("stars-week is present only for a real gain, and the default order is recommended", () => {
  const index = buildMarketIndex(
    data(
      [
        row({ id: 1, fullName: "big/old", stars: 900, installDshVersion: "0.2.0-rc.2" }),
        row({ id: 2, fullName: "new/hot", stars: 120 }),
      ],
      { weekGain: [[2, 80]] },
    ),
  );
  const [first, second] = index.plugins;
  assert.equal(first.name, "pkg-2");
  assert.equal(first.metadata.sortKeys["stars-week"], 80);
  assert.equal("stars-week" in second.metadata.sortKeys, false);
  for (const p of index.plugins) {
    for (const k of Object.keys(p.metadata.sortKeys)) assert.ok(k in index.metadata.sortKeys, k);
    assert.ok(Number.isFinite(p.metadata.sortKeys.recommended));
  }
});

test("names stay unique and unwritable releases are left out", () => {
  const index = buildMarketIndex(
    data([
      row({ id: 1, fullName: "a/one", verifiedRelease: release("same") }),
      row({ id: 2, fullName: "a/one-renamed", verifiedRelease: release("same") }),
      row({ id: 3, fullName: "b/bad", verifiedRelease: "{not json" }),
      row({ id: 4, fullName: "c/range", verifiedRelease: release("ranged", "$(rm -rf)") }),
    ]),
  );
  assert.deepEqual(index.plugins.map((p) => p.name), ["same"]);
});

test("compareVersions follows SemVer precedence", () => {
  const sorted = ["0.2.1-rc.2", "0.2.0", "0.2.1", "0.2.1-rc.10", "0.2.2-alpha.2", "0.1.0-rc.6"].sort(compareVersions);
  assert.deepEqual(sorted, ["0.1.0-rc.6", "0.2.0", "0.2.1-rc.2", "0.2.1-rc.10", "0.2.1", "0.2.2-alpha.2"]);
});

test("recommended weighs momentum and current evidence, never NaN", () => {
  const base = { stars: 100, starsWeek: 0, installs: 0, onNewestDsh: false, previewOk: false, olderRelease: false };
  assert.ok(recommendedScore({ ...base, starsWeek: 20 }) > recommendedScore(base));
  assert.ok(recommendedScore({ ...base, onNewestDsh: true }) > recommendedScore(base));
  assert.ok(recommendedScore({ ...base, olderRelease: true }) < recommendedScore(base));
  assert.ok(Number.isFinite(recommendedScore({ ...base, stars: -5 })));
});
