/**
 * One row per plugin per day into `plugin_stats`, so "trending" can be a
 * measurement instead of a guess.
 *
 * The table existed for a week with zero rows in it — the schema promised
 * daily snapshots and nothing wrote them, and every day without one is trend
 * data that cannot be reconstructed later. This runs in the nightly's `sync`
 * job because that job runs unconditionally; `apply` is skipped on nights
 * with nothing to validate, and a snapshot with holes in it reads as movement
 * that never happened.
 */
import "dotenv/config";
import { count, eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { plugins, pluginStats } from "../db/schema";

async function main() {
  // Keyed by the UTC date of the run. The nightly fires at 19:20 UTC, so the
  // label is stable across reruns of the same night.
  const day = new Date().toISOString().slice(0, 10);

  // Delete-then-insert makes a rerun replace the day instead of doubling it —
  // (plugin_id, day) is indexed but not unique, so nothing else enforces this.
  await db.delete(pluginStats).where(eq(pluginStats.day, day));

  // One INSERT..SELECT server-side, not five thousand parameterised inserts.
  await db.run(sql`
    insert into plugin_stats (plugin_id, day, stars, installs, views)
    select ${plugins.id}, ${day}, ${plugins.stars}, ${plugins.installCount}, ${plugins.viewCount}
    from ${plugins}
    where ${plugins.isArchived} = 0
  `);

  const [row] = await db
    .select({ n: count() })
    .from(pluginStats)
    .where(eq(pluginStats.day, day));

  console.log(`${row?.n ?? 0} snapshots for ${day}`);
}

main();
