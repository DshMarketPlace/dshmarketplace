import assert from "node:assert/strict";
import test from "node:test";
import { topicSlugResolver } from "./topic-slug";

test("a repository rename keeps the existing listing instead of inserting a duplicate", async () => {
  const listing = {
    fullName: "zhang66633/dsh-plugin-installer",
    slug: "zhang66633-dsh-plugin-installer",
  };
  const resolve = topicSlugResolver([listing], async (name) => {
    assert.equal(name, listing.fullName);
    return 1333695599;
  });
  assert.deepEqual(await resolve("zhang66633/.dsh-plugin-installer", 1333695599), {
    kind: "existing", listing,
  });
});

test("distinct repositories with the same normalized name both get a URL", async () => {
  const listing = { fullName: "owner/a.b", slug: "owner-a-b" };
  const resolve = topicSlugResolver([listing], async () => 1);
  assert.deepEqual(await resolve("owner/a-b", 2), {
    kind: "new", slug: "owner-a-b--2",
  });
  const nextRun = topicSlugResolver([
    listing, { fullName: "owner/a-b", slug: "owner-a-b--2" },
  ], async () => 1);
  assert.equal((await nextRun("owner/a-b", 2)).kind, "existing");
  assert.equal((await resolve("owner/a.b", 1)).kind, "existing");
});

test("failed identity lookup defers the candidate and allows a later retry", async () => {
  let available = false;
  const resolve = topicSlugResolver([
    { fullName: "owner/a.b", slug: "owner-a-b" },
  ], async () => available ? 1 : null);
  assert.equal((await resolve("owner/a-b", 2)).kind, "unresolved");
  available = true;
  assert.deepEqual(await resolve("owner/a-b", 2), {
    kind: "new", slug: "owner-a-b--2",
  });
});

test("concurrent admissions reserve different slugs before database writes", async () => {
  const resolve = topicSlugResolver([], async (name) => name === "owner/a.b" ? 1 : 2);
  const results = await Promise.all([
    resolve("owner/a.b", 1), resolve("owner/a-b", 2), resolve("owner/a_b", 3),
  ]);
  assert.deepEqual(results, [
    { kind: "new", slug: "owner-a-b" },
    { kind: "new", slug: "owner-a-b--2" },
    { kind: "new", slug: "owner-a-b--3" },
  ]);
});

test("an occupied suffix is preserved and does not block a distinct repository", async () => {
  const resolve = topicSlugResolver([
    { fullName: "owner/a.b", slug: "owner-a-b" },
    { fullName: "someone/custom", slug: "owner-a-b--2" },
  ], async (name) => name === "owner/a.b" ? 1 : 3);
  assert.deepEqual(await resolve("owner/a-b", 2), {
    kind: "new", slug: "owner-a-b--2-1",
  });
});

test("a subpackage is not mistaken for its repository root", async () => {
  const resolve = topicSlugResolver([
    { fullName: "owner/repo#child", slug: "owner-repo" },
  ], async () => { throw new Error("subpackage identity must remain separate"); });
  assert.deepEqual(await resolve("owner/repo", 1), {
    kind: "new", slug: "owner-repo--1",
  });
});
