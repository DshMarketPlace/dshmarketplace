/**
 * Applies the admission bar to rows that are already in the catalogue.
 *
 *   GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/prune-topic.ts --dry-run
 *   GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/prune-topic.ts
 *
 * `ingest-topic.ts` gained a quality bar after it had already written a batch
 * under the weaker one. This re-checks those rows rather than re-crawling the
 * topic: the expensive part is discovery, and discovery has already happened.
 *
 * Only touches `provenance = 'topic'` rows with no page and no written copy.
 * The curated seed and anything a person has worked on are never candidates —
 * a pruning job that can delete written content is one bad predicate away from
 * deleting the only thing here that cannot be regenerated.
 */
import "dotenv/config";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { commitCount, exhausted } from "./lib/github";

const CONCURRENCY = 6;
const MIN_COMMITS = 10;

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const rows = await db
    .select({
      id: plugins.id,
      fullName: plugins.fullName,
      owner: plugins.owner,
      repo: plugins.repo,
      summary: plugins.summary,
      stars: plugins.stars,
    })
    .from(plugins)
    .where(
      and(
        eq(plugins.provenance, "topic"),
        eq(plugins.visibility, "hidden"),
        isNull(plugins.overview),
      ),
    );

  console.log(`${rows.length} topic rows to check, bar is ${MIN_COMMITS} commits\n`);

  const histogram: Record<string, number> = {};
  const bucket = (n: number) =>
    n < 5 ? "1-4" : n < 10 ? "5-9" : n < 25 ? "10-24" : n < 100 ? "25-99" : "100+";

  const doomed: number[] = [];
  const reasons: Record<string, number> = {};
  let checked = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    await Promise.all(
      rows.slice(i, i + CONCURRENCY).map(async (row) => {
        checked++;

        if (!row.summary?.trim()) {
          doomed.push(row.id);
          reasons["no description"] = (reasons["no description"] ?? 0) + 1;
          return;
        }

        const commits = await commitCount(row.owner, row.repo, "dshmarketplace-prune");
        if (commits === null) {
          reasons["unreachable, kept"] = (reasons["unreachable, kept"] ?? 0) + 1;
          return;
        }

        histogram[bucket(commits)] = (histogram[bucket(commits)] ?? 0) + 1;

        if (commits < MIN_COMMITS) {
          doomed.push(row.id);
          reasons[`under ${MIN_COMMITS} commits`] =
            (reasons[`under ${MIN_COMMITS} commits`] ?? 0) + 1;
        }
      }),
    );

    if (checked % 200 < CONCURRENCY) {
      console.log(`  …${checked}/${rows.length}, ${doomed.length} failing`);
    }

    // Every remaining row could only answer "unknown, kept". Walking them
    // costs minutes the sandbox and the reviews are waiting on.
    if (exhausted()) {
      console.log(`  stopped at ${checked}/${rows.length}: out of API quota`);
      break;
    }
  }

  console.log("\ncommits");
  for (const key of ["1-4", "5-9", "10-24", "25-99", "100+"]) {
    if (histogram[key]) console.log(`  ${key.padStart(6)}  ${histogram[key]}`);
  }

  console.log("\nfailing the bar");
  for (const [why, n] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${why}`);
  }

  if (dryRun) {
    console.log(`\n${doomed.length} would be removed (dry run — nothing written)`);
    return;
  }

  for (let i = 0; i < doomed.length; i += 200) {
    await db.delete(plugins).where(inArray(plugins.id, doomed.slice(i, i + 200)));
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(plugins)
    .where(eq(plugins.isArchived, false));

  console.log(`\n${doomed.length} removed, catalogue now ${total}`);
}

main();
