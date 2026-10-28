import assert from "node:assert/strict";
import test from "node:test";

import { securityFacts, type SecurityFields } from "../../lib/security";

const row = (over: Partial<SecurityFields>): SecurityFields => ({
  owner: "toolclub",
  repo: "dsh-agent-team-gui",
  installStatus: "passed",
  blockedBuilds: null,
  riskFlags: "[]",
  ...over,
});

test("a held build names the plugin's own prepare script as its own", () => {
  const facts = securityFacts(
    row({
      installStatus: "needs-approval",
      blockedBuilds: '["github:toolclub/dsh-agent-team-gui","esbuild@0.25.0"]',
    }),
  );
  assert.deepEqual(facts.build, {
    kind: "held",
    builds: [
      { name: "github:toolclub/dsh-agent-team-gui", self: true },
      { name: "esbuild@0.25.0", self: false },
    ],
  });
});

test("a passed install with blocked scripts reports them as skipped, not held", () => {
  const facts = securityFacts(row({ blockedBuilds: '["cpu-features@0.0.10"]' }));
  assert.equal(facts.build.kind, "skipped");
});

test("only verdicts where pnpm ran can speak about scripts", () => {
  assert.deepEqual(securityFacts(row({ installStatus: null })).build, {
    kind: "unmeasured",
    reason: "never",
  });
  assert.deepEqual(securityFacts(row({ installStatus: "incompatible" })).build, {
    kind: "unmeasured",
    reason: "refused",
  });
  assert.deepEqual(securityFacts(row({ installStatus: "failed" })).build, {
    kind: "unmeasured",
    reason: "incomplete",
  });
  assert.deepEqual(securityFacts(row({ installStatus: "not-a-layer" })).build, { kind: "none" });
});

test("a scan that never ran is unknown, not clean", () => {
  const facts = securityFacts(row({ riskFlags: null }));
  assert.equal(facts.lifecycle, null);
  assert.equal(facts.readme, null);
});

test("risk flags split into lifecycle and README rows", () => {
  const facts = securityFacts(row({ riskFlags: '["install script","requires credentials"]' }));
  assert.equal(facts.lifecycle, true);
  assert.deepEqual(facts.readme, { terminal: false, credentials: true });
});

test("malformed JSON degrades to empty rather than throwing on the page", () => {
  const facts = securityFacts(row({ riskFlags: "not json", blockedBuilds: "{" }));
  assert.equal(facts.lifecycle, false);
  assert.equal(facts.build.kind, "none");
});
