import assert from "node:assert/strict";
import test from "node:test";

import { encodeKey, parseName, parseNames } from "../../lib/compat-names";
import {
  pickPreviewCandidates,
  previewRejection,
  summariseTag,
  tagsToPreview,
} from "../../lib/compat-summary";

const keys = (input: string) => parseNames(input).keys.map((k) => `${k.kind}:${k.key}`);

test("names: npm, scoped, repo, github: and URLs each land on the right key", () => {
  assert.deepEqual(parseName("dsh-better-sidebar"), { kind: "npm", key: "dsh-better-sidebar" });
  assert.deepEqual(parseName("@tt-a1i/archify-dsh@0.3.1"), { kind: "npm", key: "@tt-a1i/archify-dsh" });
  assert.deepEqual(parseName("dsh-better-sidebar@0.26.1"), { kind: "npm", key: "dsh-better-sidebar" });
  assert.deepEqual(parseName("Owner/Repo"), { kind: "repo", key: "Owner/Repo" });
  assert.deepEqual(parseName("github:zouyuxuan122/dsh-our-free-model"), {
    kind: "repo",
    key: "zouyuxuan122/dsh-our-free-model",
  });
  assert.deepEqual(parseName("https://github.com/a/b.git"), { kind: "repo", key: "a/b" });
  assert.deepEqual(parseName("https://github.com/a/b/tree/main/pkg"), { kind: "repo", key: "a/b" });
});

test("names: a pnpm path: fragment is the subpath, any other fragment is a ref", () => {
  assert.equal(parseName("github:PC2005-cloud/dsh-pet#path:dsh-pet")?.key, "PC2005-cloud/dsh-pet#dsh-pet");
  assert.equal(parseName("github:a/b#path:/examples/x")?.key, "a/b#examples/x");
  assert.equal(parseName("github:a/b#main")?.key, "a/b");
  assert.equal(parseName("github:a/b#v1.0::path:sub")?.key, "a/b#sub");
});

test("names: `owner/repo:sub` is `owner/repo#sub`, and that is what goes over the wire", () => {
  assert.deepEqual(parseName("a/b:examples/x"), { kind: "repo", key: "a/b#examples/x" });
  assert.deepEqual(parseName("a/b#examples/x"), { kind: "repo", key: "a/b#examples/x" });
  assert.deepEqual(parseName("a/b#path:examples/x"), { kind: "repo", key: "a/b#examples/x" });
  // Cloudflare cuts a query at `#`, even as %23.
  assert.equal(encodeKey({ kind: "repo", key: "a/b#examples/x" }), "a/b:examples/x");
  assert.equal(parseName(encodeKey({ kind: "repo", key: "a/b#examples/x" }))?.key, "a/b#examples/x");
});

test("names: anything that is not a name is refused, not looked up", () => {
  // npm names are lowercase by rule, so a capitalised one is the same name typed loosely.
  assert.deepEqual(parseName("DSH-Pet"), { kind: "npm", key: "dsh-pet" });
  for (const bad of ["", "a/b/c", "'; drop table plugins;--", "@scope", "../etc/passwd", "x".repeat(400)]) {
    assert.equal(parseName(bad), null, bad);
  }
});

test("names: whitespace, newlines and commas all separate; duplicates collapse", () => {
  assert.deepEqual(keys("a\nb  c,d\n\na"), ["npm:a", "npm:b", "npm:c", "npm:d"]);
});

test("names: a pasted dsh plugin add line yields only its targets", () => {
  assert.deepEqual(keys("$ dsh plugin --profile web add @x/y github:o/r npx"), ["npm:@x/y", "repo:o/r"]);
});

test("names: a profile package.json is read for its dependencies, host packages skipped", () => {
  const pkg = JSON.stringify({
    name: "web",
    dependencies: {
      "@deepseek-ai/dsh-base": "0.2.1-rc.2",
      "dsh-better-sidebar": "^0.26.1",
      "dsh-pet": "github:PC2005-cloud/dsh-pet#path:dsh-pet",
      "@liustack/modlens": "1.0.0",
    },
  });
  assert.deepEqual(keys(pkg), ["npm:dsh-better-sidebar", "repo:PC2005-cloud/dsh-pet#dsh-pet", "npm:@liustack/modlens"]);
});

test("names: broken JSON falls back to plain tokens", () => {
  assert.deepEqual(parseNames('{"dependencies": {"a": "1"').keys.length > 0, true);
});

test("names: the cap drops and counts, never silently truncates", () => {
  const input = Array.from({ length: 105 }, (_, i) => `p${i}`).join(" ");
  const parsed = parseNames(input);
  assert.equal(parsed.keys.length, 100);
  assert.equal(parsed.overflow, 5);
});

test("tags: a tag on the same release as latest gets no run", () => {
  assert.deepEqual(tagsToPreview({ latest: "0.2.1-rc.2", next: "0.2.1-rc.4", alpha: "0.2.2-alpha.2" }), [
    { tag: "next", version: "0.2.1-rc.4" },
    { tag: "alpha", version: "0.2.2-alpha.2" },
  ]);
  assert.deepEqual(tagsToPreview({ latest: "0.2.1", next: "0.2.1" }), []);
});

test("candidates: never-checked first, then oldest check, then installs, then stars", () => {
  const picked = pickPreviewCandidates(
    [
      { fullName: "checked-old", stars: 900, installs: 90, lastChecked: 100 },
      { fullName: "checked-new", stars: 999, installs: 99, lastChecked: 200 },
      { fullName: "fresh-starred", stars: 500, installs: 0, lastChecked: null },
      { fullName: "fresh-installed", stars: 10, installs: 5, lastChecked: null },
    ],
    3,
  ).map((c) => c.fullName);
  assert.deepEqual(picked, ["fresh-installed", "fresh-starred", "checked-old"]);
});

test("apply: no verdict, no dsh, a throttle and a changed command are all refused", () => {
  const ok = { fullName: "a/b", install: "cmd", status: "failed", dshVersion: "0.2.2-alpha.2" };
  assert.equal(previewRejection(ok, "cmd"), null);
  assert.equal(previewRejection({ ...ok, status: "error" }, "cmd"), "no-verdict");
  assert.equal(previewRejection({ ...ok, dshVersion: null }, "cmd"), "no-dsh");
  assert.equal(previewRejection({ ...ok, log: "ERR_PNPM_FETCH_429 GET" }, "cmd"), "throttled");
  assert.equal(previewRejection({ ...ok, log: "declares no dsh.bundle" }, "cmd"), "superseded");
  assert.equal(previewRejection(ok, "other"), "stale");
});

test("summary: only runs on the tag's newest release count", () => {
  const s = summariseTag([
    { fullName: "a", dshVersion: "0.2.2-alpha.2", status: "passed", ranAt: 300 },
    { fullName: "b", dshVersion: "0.2.2-alpha.2", status: "incompatible", ranAt: 290 },
    { fullName: "c", dshVersion: "0.2.2-alpha.1", status: "failed", ranAt: 100 },
  ]);
  assert.equal(s.version, "0.2.2-alpha.2");
  assert.equal(s.checked, 2);
  assert.equal(s.passed, 1);
  assert.deepEqual(s.broken, ["b"]);
  assert.deepEqual(summariseTag([]), { version: null, ranAt: null, checked: 0, passed: 0, counts: {}, broken: [] });
});
