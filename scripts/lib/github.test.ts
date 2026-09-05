import assert from "node:assert/strict";
import test from "node:test";

import { repoContentPath } from "./github";

test("builds a repository-root contents path", () => {
  assert.equal(
    repoContentPath("moguiyu", "dsh-tavily", "package.json"),
    "/repos/moguiyu/dsh-tavily/contents/package.json",
  );
});

test("keeps a monorepo package path below the contents endpoint", () => {
  assert.equal(
    repoContentPath(
      "moguiyu",
      "dsh-tavily",
      "packages/dsh-tavily/package.json",
    ),
    "/repos/moguiyu/dsh-tavily/contents/packages/dsh-tavily/package.json",
  );
});

test("encodes every repository path segment", () => {
  assert.equal(
    repoContentPath(
      "owner name",
      "repo#name",
      "packages/a package/package.json",
    ),
    "/repos/owner%20name/repo%23name/contents/packages/a%20package/package.json",
  );
});

test("rejects a path that could leave the contents endpoint", () => {
  assert.throws(
    () => repoContentPath("owner", "repo", "packages/../package.json"),
    /Invalid repository content path/,
  );
});
