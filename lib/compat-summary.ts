/**
 * Pure logic behind the upgrade check: which dist-tags get a run, which
 * results may be recorded, and what a tag's runs add up to. No database and
 * no framework, so the nightly scripts, the site and the tests share it.
 */

/** The upcoming dsh releases the sandbox previews, in display order. */
export const PREVIEW_TAGS = ["next", "alpha"] as const;
export type PreviewTag = (typeof PREVIEW_TAGS)[number];

export function isPreviewTag(value: string): value is PreviewTag {
  return (PREVIEW_TAGS as readonly string[]).includes(value);
}

/**
 * The tags worth a run tonight. A tag that resolves to the same release as
 * `latest` is already measured by the nightly verdicts, and a second run of it
 * would only spend sandbox time reporting the same thing under another name.
 */
export function tagsToPreview(
  distTags: Record<string, string | undefined>,
): { tag: PreviewTag; version: string }[] {
  const latest = distTags.latest;
  return PREVIEW_TAGS.flatMap((tag) => {
    const version = distTags[tag];
    return version && version !== latest ? [{ tag, version }] : [];
  });
}

export type PreviewCandidate = {
  fullName: string;
  stars: number;
  installs: number;
  /** Unix seconds of the last run on this tag's current release, or null. */
  lastChecked: number | null;
};

/**
 * Never-checked first, then the longest unchecked; ties go to what people
 * install, then to stars. A run on an older release of the tag counts as no
 * run at all — the caller passes null for it — so when a tag moves the cycle
 * restarts from the plugins most people have.
 */
export function pickPreviewCandidates(
  candidates: PreviewCandidate[],
  limit: number,
): PreviewCandidate[] {
  return [...candidates]
    .sort(
      (a, b) =>
        (a.lastChecked ?? -1) - (b.lastChecked ?? -1) ||
        b.installs - a.installs ||
        b.stars - a.stars ||
        a.fullName.localeCompare(b.fullName),
    )
    .slice(0, Math.max(0, limit));
}

export type PreviewResult = {
  fullName?: string;
  install?: string;
  status?: string;
  dshVersion?: string | null;
  log?: string;
};

export type Rejection = "no-verdict" | "no-dsh" | "throttled" | "superseded" | "stale";

/**
 * Why a preview result must not be recorded, or null when it may be. The same
 * guards `apply-validations.ts` applies to the published verdicts, for the
 * same reasons: a run with no verdict, a host throttling us and a probe that
 * called a plain dependency a failure all measure us, not the plugin; and a
 * verdict belongs to the command that was run.
 */
export function previewRejection(
  r: PreviewResult,
  currentInstall: string | undefined,
): Rejection | null {
  if (!r.fullName || !r.status || r.status === "error") return "no-verdict";
  // Without the version the run proves nothing about any particular release.
  if (!r.dshVersion) return "no-dsh";
  if (/ERR_PNPM_FETCH_(429|5\d\d)\b/.test(r.log ?? "")) return "throttled";
  if (r.status === "failed" && /declares no dsh\.bundle/.test(r.log ?? "")) return "superseded";
  if (r.install && currentInstall !== r.install) return "stale";
  return null;
}

export type LatestRun = {
  fullName: string;
  dshVersion: string | null;
  status: string;
  /** Unix seconds. */
  ranAt: number;
};

export type TagSummary = {
  /** The release this tag pointed at on its most recent run. */
  version: string | null;
  ranAt: number | null;
  checked: number;
  passed: number;
  counts: Record<string, number>;
  /** Plugins whose latest run on `version` did not pass. */
  broken: string[];
};

/**
 * One tag's latest run per plugin → the numbers the page prints. Only runs on
 * the tag's current release count: when `alpha` moves, last week's alpha says
 * nothing about this week's, so the count starts over rather than mixing two
 * releases under one heading.
 */
export function summariseTag(latest: LatestRun[]): TagSummary {
  let newest: LatestRun | null = null;
  for (const r of latest) if (!newest || r.ranAt > newest.ranAt) newest = r;
  const version = newest?.dshVersion ?? null;

  const counts: Record<string, number> = {};
  const broken: string[] = [];
  let checked = 0;
  for (const r of latest) {
    if (r.dshVersion !== version) continue;
    checked++;
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    if (r.status !== "passed") broken.push(r.fullName);
  }
  return {
    version,
    ranAt: newest?.ranAt ?? null,
    checked,
    passed: counts.passed ?? 0,
    counts,
    broken,
  };
}
