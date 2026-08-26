/**
 * Withdraws verdicts that were never about the plugin, and the reviews built
 * on them.
 *
 *   pnpm tsx scripts/retract-verdicts.ts names.txt [--dry]
 *
 * Two guards already refuse to publish these — a throttled run is discarded in
 * `apply-validations.ts`, and a package the harness declined to make a profile
 * layer now gets its own verdict in the probe. Both were added after the runs
 * that needed them, so the rows they would have stopped are already live and
 * have to be taken back by name.
 *
 * The review goes with the verdict. A paragraph that says "the sandbox saw it
 * fail" outlives the measurement it cites unless something deletes it, and
 * clearing only `installStatus` makes that worse: `write-review.ts` rewrites a
 * review when `reviewedAt < installCheckedAt`, so a null timestamp means the
 * false sentence is never revisited.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { inArray, sql } from "drizzle-orm";

import { db } from "../db/client";
import { plugins, installRuns } from "../db/schema";
import { persist } from "./lib/persist";

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: pnpm tsx scripts/retract-verdicts.ts names.txt [--dry]");
    process.exit(1);
  }
  const dry = process.argv.includes("--dry");

  const names = readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = await db
    .select({
      fullName: plugins.fullName,
      status: plugins.installStatus,
      reviewed: plugins.reviewedAt,
      checked: plugins.installCheckedAt,
    })
    .from(plugins)
    .where(inArray(plugins.fullName, names));

  const found = new Set(rows.map((r) => r.fullName));
  const missing = names.filter((n) => !found.has(n));

  // A review written after the verdict landed is a review that could have read
  // it. Counted rather than assumed, because it decides how much text is lost.
  const citing = rows.filter(
    (r) => r.reviewed && r.checked && r.reviewed >= r.checked,
  );

  console.log(`${names.length} named, ${rows.length} matched`);
  if (missing.length) console.log(`  not in the catalogue: ${missing.join(", ")}`);
  console.log(`  ${citing.length} of them carry a review written after the verdict`);
  for (const r of rows) console.log(`  ${r.status ?? "-"}  ${r.fullName}`);

  if (dry) return;

  const result = await persist(() =>
    db
      .update(plugins)
      .set({
        installStatus: null,
        installDetail: null,
        blockedBuilds: null,
        installCheckedAt: null,
        review: null,
        reviewZh: null,
        reviewHtml: null,
        reviewHtmlZh: null,
        reviewModel: null,
        reviewedAt: null,
        updatedAt: new Date(),
      })
      .where(inArray(plugins.fullName, [...found])),
  );

  console.log(
    `\nretracted ${result.rowsAffected ?? found.size}; they re-enter both queues`,
  );

  // History is marked, never deleted: the run happened, we just no longer
  // stand behind what it said. Only the newest unretracted run per name — that
  // is the one whose verdict the plugins table was carrying.
  if (found.size) {
    const names = sql.join(
      [...found].map((n) => sql`${n}`),
      sql`, `,
    );
    const marked = await persist(() =>
      db.run(sql`
        update install_runs set retracted_at = unixepoch()
        where id in (
          select max(id) from install_runs
          where full_name in (${names}) and retracted_at is null
          group by full_name
        )
      `),
    );
    console.log(`marked ${marked.rowsAffected ?? 0} history rows retracted`);
  }
}

main();
