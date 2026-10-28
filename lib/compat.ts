import { and, eq, gte, inArray, lt, lte, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/db/client";
import { compatRuns, plugins } from "@/db/schema";
import type { CompatKey } from "@/lib/compat-names";
import { PREVIEW_TAGS, summariseTag, type PreviewTag, type TagSummary } from "@/lib/compat-summary";
import { directory } from "@/directory.config";

/** Same window and tag as the catalogue aggregates in `lib/data.ts`. */
const CATALOG_TTL = 900;
const CATALOG_TAG = "catalog";

/**
 * Exactly the columns of `plugins_compat_cover_idx`. Each one sits past the
 * README, so a column added here that the index lacks turns every lookup
 * into a README read per name (CLAUDE.md rule 7).
 */
const COVERED = {
  fullName: plugins.fullName,
  isArchived: plugins.isArchived,
  installStatus: plugins.installStatus,
  installDshVersion: plugins.installDshVersion,
  npmPackage: plugins.npmPackage,
  visibility: plugins.visibility,
  slug: plugins.slug,
  stars: plugins.stars,
};

type CoveredRow = {
  fullName: string;
  isArchived: boolean;
  installStatus: string | null;
  installDshVersion: string | null;
  npmPackage: string | null;
  visibility: string;
  slug: string;
  stars: number;
};

/**
 * Migration 0012 is applied by hand, and a deploy can land first: every page
 * prerenders at build, so an unguarded read would fail the whole deploy over
 * one new page. Only this exact error reads as "no runs yet".
 */
function isMissingTable(err: unknown): boolean {
  for (let e = err; e instanceof Error; e = e.cause) {
    if (/no such table: compat_runs/.test(e.message)) return true;
  }
  return false;
}

async function orNone<T>(read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch (err) {
    if (isMissingTable(err)) return [];
    throw err;
  }
}

function listingUrl(p: Pick<CoveredRow, "visibility" | "slug" | "fullName">): string {
  return p.visibility === "hidden"
    ? `https://github.com/${p.fullName.split("#")[0]}`
    : `${directory.baseUrl}/plugins/${p.slug}`;
}

async function coveredByName(names: string[]): Promise<CoveredRow[]> {
  if (!names.length) return [];
  // Every name is a range on full_name, which is what makes the planner take
  // plugins_compat_cover_idx for each OR term (EXPLAIN QUERY PLAN on
  // production's schema). An `=` term takes the unique index and reads the
  // row's README instead, and an extra is_archived term pulls the whole OR
  // onto plugins_archived_created_idx — a scan of every row.
  //
  // A bare `owner/repo` is [n, n + "$"): the name itself and its subpath
  // listings (`owner/repo#sub`), since a repo name holds no character below
  // `$` other than our `#`. A name with a subpath is just itself.
  const terms = names.map((n) =>
    n.includes("#")
      ? and(gte(plugins.fullName, n), lte(plugins.fullName, n))
      : and(gte(plugins.fullName, n), lt(plugins.fullName, `${n}$`)),
  );
  return db.select(COVERED).from(plugins).where(or(...terms));
}

export type PreviewRun = {
  dsh: string;
  verdict: string;
  detail: string | null;
  ranAt: string;
};

/** The newest run per (plugin, tag), for a bounded list of names. */
async function latestRuns(names: string[]): Promise<Map<string, Partial<Record<PreviewTag, PreviewRun>>>> {
  const out = new Map<string, Partial<Record<PreviewTag, PreviewRun>>>();
  if (!names.length) return out;
  // SQLite returns the bare columns of the row that holds the max() — the
  // documented single-aggregate rule — so this is "latest row per group" in
  // one pass over compat_runs_name_tag_ran_idx.
  const rows = await orNone(() =>
    db
      .select({
        fullName: compatRuns.fullName,
        dshTag: compatRuns.dshTag,
        dshVersion: compatRuns.dshVersion,
        status: compatRuns.status,
        detail: compatRuns.detail,
        ranAt: sql<number>`max(${compatRuns.ranAt})`,
      })
      .from(compatRuns)
      .where(inArray(compatRuns.fullName, names))
      .groupBy(compatRuns.fullName, compatRuns.dshTag),
  );
  for (const r of rows) {
    if (!(PREVIEW_TAGS as readonly string[]).includes(r.dshTag)) continue;
    const entry = out.get(r.fullName) ?? {};
    entry[r.dshTag as PreviewTag] = {
      dsh: r.dshVersion,
      verdict: r.status,
      detail: r.detail ? r.detail.slice(0, 300) : null,
      ranAt: new Date(Number(r.ranAt) * 1000).toISOString(),
    };
    out.set(r.fullName, entry);
  }
  return out;
}

export type CompatResult = {
  query: string;
  fullName: string | null;
  url: string | null;
  current: { verdict: string | null; dsh: string | null } | null;
  preview: Partial<Record<PreviewTag, PreviewRun>>;
};

/** The best listing for a name: live before archived, then most-starred. */
function best(rows: CoveredRow[]): CoveredRow | undefined {
  return [...rows].sort((a, b) => Number(a.isArchived) - Number(b.isArchived) || b.stars - a.stars)[0];
}

/**
 * What the sandbox knows about each pasted name: the published verdict on
 * `latest`, and the newest preview run per upcoming tag. Three indexed reads
 * whatever the list holds — never one per name.
 */
export async function getCompatFor(keys: CompatKey[]): Promise<CompatResult[]> {
  const npmNames = keys.filter((k) => k.kind === "npm").map((k) => k.key);
  const repoNames = keys.filter((k) => k.kind === "repo").map((k) => k.key);

  // full_name is the row's second column, so reading it off
  // plugins_npm_package_idx touches no README overflow.
  const byNpm = npmNames.length
    ? await db
        .select({ fullName: plugins.fullName, npmPackage: plugins.npmPackage })
        .from(plugins)
        .where(inArray(plugins.npmPackage, npmNames))
    : [];

  const listings = await coveredByName([...new Set([...repoNames, ...byNpm.map((r) => r.fullName)])]);
  const byName = new Map(listings.map((p) => [p.fullName, p]));
  const runs = await latestRuns(listings.map((p) => p.fullName));

  return keys.map((k) => {
    const match =
      k.kind === "repo"
        ? (byName.get(k.key) ?? best(listings.filter((p) => p.fullName.startsWith(`${k.key}#`))))
        : best(listings.filter((p) => p.npmPackage === k.key));
    if (!match) return { query: k.key, fullName: null, url: null, current: null, preview: {} };
    return {
      query: k.key,
      fullName: match.fullName,
      url: listingUrl(match),
      current: { verdict: match.installStatus, dsh: match.installDshVersion },
      preview: runs.get(match.fullName) ?? {},
    };
  });
}

export type PreviewVerdicts = {
  tag: PreviewTag;
  /** The release the tag pointed at on its newest run. */
  version: string;
  /** Latest verdict per plugin on exactly that release. */
  verdicts: Record<string, string>;
};

/**
 * Per upcoming tag, every plugin's latest verdict on the tag's current
 * release — what the plugin index labels. Uncached: its caller caches.
 * One grouped read per tag over compat_runs_tag_version_idx.
 */
export async function getPreviewVerdicts(): Promise<PreviewVerdicts[]> {
  const out: PreviewVerdicts[] = [];
  for (const tag of PREVIEW_TAGS) {
    const rows = await orNone(() =>
      db
        .select({
          fullName: compatRuns.fullName,
          dshVersion: compatRuns.dshVersion,
          status: compatRuns.status,
          ranAt: sql<number>`max(${compatRuns.ranAt})`,
        })
        .from(compatRuns)
        .where(eq(compatRuns.dshTag, tag))
        .groupBy(compatRuns.fullName),
    );
    const latest = rows.map((r) => ({ ...r, ranAt: Number(r.ranAt) }));
    const { version } = summariseTag(latest);
    if (!version) continue;
    const verdicts: Record<string, string> = {};
    for (const r of latest) if (r.dshVersion === version) verdicts[r.fullName] = r.status;
    out.push({ tag, version, verdicts });
  }
  return out;
}

export type Regression = {
  fullName: string;
  slug: string;
  visibility: string;
  stars: number;
  dsh: string | null;
  preview: Partial<Record<PreviewTag, string>>;
};

export type CompatSummary = {
  tags: Partial<Record<PreviewTag, TagSummary>>;
  regressions: Regression[];
};

/**
 * Per tag: how its latest runs came out on its current release; and the
 * most-starred plugins that pass on `latest` but not on an upcoming tag.
 * Scans compat_runs per tag, so it is cached like every catalogue aggregate.
 */
export const getCompatSummary = unstable_cache(
  async (): Promise<CompatSummary> => {
    const perTag = await Promise.all(
      PREVIEW_TAGS.map(async (tag) => {
        const rows = await orNone(() =>
          db
            .select({
              fullName: compatRuns.fullName,
              dshVersion: compatRuns.dshVersion,
              status: compatRuns.status,
              ranAt: sql<number>`max(${compatRuns.ranAt})`,
            })
            .from(compatRuns)
            .where(eq(compatRuns.dshTag, tag))
            .groupBy(compatRuns.fullName),
        );
        return [tag, summariseTag(rows.map((r) => ({ ...r, ranAt: Number(r.ranAt) })))] as const;
      }),
    );

    const tags: Partial<Record<PreviewTag, TagSummary>> = {};
    const broken = new Set<string>();
    for (const [tag, summary] of perTag) {
      if (!summary.checked) continue;
      // The name list is only needed here, and the cache serialises
      // whatever is returned.
      tags[tag] = { ...summary, broken: [] };
      for (const name of summary.broken) broken.add(name);
    }
    if (!broken.size) return { tags, regressions: [] };

    const names = [...broken];
    const [listings, runs] = await Promise.all([coveredByName(names), latestRuns(names)]);
    const regressions = listings
      .filter((p) => !p.isArchived && p.installStatus === "passed")
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 30)
      .map((p) => {
        const preview: Partial<Record<PreviewTag, string>> = {};
        for (const tag of PREVIEW_TAGS) {
          const run = runs.get(p.fullName)?.[tag];
          if (run && run.dsh === tags[tag]?.version) preview[tag] = run.verdict;
        }
        return {
          fullName: p.fullName,
          slug: p.slug,
          visibility: p.visibility,
          stars: p.stars,
          dsh: p.installDshVersion,
          preview,
        };
      });
    return { tags, regressions };
  },
  ["compat-summary"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] },
);
