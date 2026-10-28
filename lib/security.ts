import type { Plugin } from "@/db/schema";

/**
 * The security block's facts, derived only from columns the catalogue already
 * holds. Nothing here is inferred from the code: one row is a sandbox install,
 * the other two are text scans made during sync, and the block says which.
 */
export type SecurityFields = Pick<
  Plugin,
  "owner" | "repo" | "installStatus" | "blockedBuilds" | "riskFlags"
>;

export type BlockedBuild = { name: string; self: boolean };

export type BuildScripts =
  /** `needs-approval`: pnpm held a script and the harness never registered it. */
  | { kind: "held"; builds: BlockedBuild[] }
  /** The install registered with these scripts skipped (pnpm 10 warns, 11 stops). */
  | { kind: "skipped"; builds: BlockedBuild[] }
  | { kind: "none" }
  /** No install ran far enough to say: never run, refused, failed or timed out. */
  | { kind: "unmeasured"; reason: "never" | "refused" | "incomplete" };

export type SecurityFacts = {
  build: BuildScripts;
  /** preinstall / install / postinstall in package.json; null until a sync read it. */
  lifecycle: boolean | null;
  /** README keyword hits; null until a sync scanned it. */
  readme: { terminal: boolean; credentials: boolean } | null;
};

// The verdicts after which pnpm actually ran: only these can report on scripts.
const INSTALLED = new Set(["passed", "needs-approval", "not-a-layer"]);

function parseList(json: string | null): string[] {
  if (!json) return [];
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * A source install's own `prepare` comes back as `github:owner/repo`, the key
 * pnpm asks to allowlist — naming it as the plugin's own script tells a reader
 * it is not some dependency they have never heard of.
 */
function blocked(p: SecurityFields): BlockedBuild[] {
  const own = `github:${p.owner}/${p.repo}`.toLowerCase();
  return parseList(p.blockedBuilds).map((name) => ({
    name,
    self: name.toLowerCase() === own || name.toLowerCase().startsWith(`${own}#`),
  }));
}

function buildScripts(p: SecurityFields): BuildScripts {
  const status = p.installStatus;
  if (!status) return { kind: "unmeasured", reason: "never" };
  if (status === "incompatible") return { kind: "unmeasured", reason: "refused" };
  if (!INSTALLED.has(status)) return { kind: "unmeasured", reason: "incomplete" };

  const builds = blocked(p);
  if (status === "needs-approval") return { kind: "held", builds };
  return builds.length ? { kind: "skipped", builds } : { kind: "none" };
}

export function securityFacts(p: SecurityFields): SecurityFacts {
  // Null means sync never read the repo; `[]` means it read it and found
  // nothing. The block must not print "none" for a scan that never happened.
  const flags = p.riskFlags === null ? null : parseList(p.riskFlags);
  return {
    build: buildScripts(p),
    lifecycle: flags ? flags.includes("install script") : null,
    readme: flags
      ? {
          terminal: flags.includes("terminal surface"),
          credentials: flags.includes("requires credentials"),
        }
      : null,
  };
}
