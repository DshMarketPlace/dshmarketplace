/**
 * The staged rollout, as a CLI. Promotes at most `--limit` pages to `indexed`
 * per run, highest content score first, and only above the quality threshold.
 *
 *   pnpm tsx scripts/promote.ts --limit 10
 *   pnpm tsx scripts/promote.ts --dry-run
 *
 * Ten a day keeps the crawl footprint honest and keeps any ranking movement
 * attributable to a single change. Mirrors promoteBatch() in
 * lib/plugin-actions.ts, minus the revalidatePath calls — those need a request
 * context, and the deploy revalidates everything anyway.
 */
import "dotenv/config";
import { and, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { PROMOTION_THRESHOLD } from "../lib/plugin-scoring";

async function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--limit");
  const limit = Number(i === -1 ? 10 : argv[i + 1]);
  const dryRun = argv.includes("--dry-run");

  const candidates = await db
    .select({
      id: plugins.id,
      slug: plugins.slug,
      name: plugins.name,
      score: plugins.contentScore,
      stars: plugins.stars,
    })
    .from(plugins)
    .where(
      and(
        ne(plugins.visibility, "indexed"),
        eq(plugins.isArchived, false),
        sql`${plugins.contentScore} >= ${PROMOTION_THRESHOLD}`,
      ),
    )
    .orderBy(desc(plugins.contentScore), desc(plugins.stars))
    .limit(limit);

  if (candidates.length === 0) {
    console.log("nothing above the threshold — write more overviews first");
    return;
  }

  for (const c of candidates) {
    console.log(`  ${c.score}  ${c.name}  /plugins/${c.slug}`);
  }

  if (dryRun) {
    console.log(`\n${candidates.length} would be promoted`);
    return;
  }

  const now = new Date();
  for (const c of candidates) {
    await db
      .update(plugins)
      .set({ visibility: "indexed", indexedAt: now, updatedAt: now })
      .where(eq(plugins.id, c.id));
  }

  console.log(`\npromoted ${candidates.length} page(s) to indexed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
