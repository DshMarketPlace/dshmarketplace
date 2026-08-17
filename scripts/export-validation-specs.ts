/**
 * Writes the install commands the sandbox should try, newest-starred first.
 *
 *   pnpm tsx scripts/export-validation-specs.ts > /tmp/specs.jsonl
 *
 * Only listings that publish a command at all: a plugin with `install: null`
 * has nothing to run, and running nothing proves nothing.
 */
import "dotenv/config";
import { and, desc, eq, isNull, or, lt } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { primaryInstall } from "../lib/install";

const STALE_AFTER_DAYS = 30;

async function main() {
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 86_400_000);
  // A nightly run should cost minutes, not hours: after the first sweep the
  // only candidates are new listings and ones whose command changed. The cap
  // keeps a backlog from turning one night's run into a six-hour job.
  const flag = process.argv.indexOf("--limit");
  const limit = flag === -1 ? Infinity : Number(process.argv[flag + 1]);

  const rows = await db
    .select()
    .from(plugins)
    .where(
      and(
        eq(plugins.isArchived, false),
        or(isNull(plugins.installCheckedAt), lt(plugins.installCheckedAt, cutoff)),
      ),
    )
    .orderBy(desc(plugins.stars));

  let written = 0;
  for (const row of rows) {
    if (written >= limit) break;
    const cmd = primaryInstall(row)?.cmd;
    if (!cmd) continue;
    process.stdout.write(JSON.stringify({ fullName: row.fullName, install: cmd }) + "\n");
    written++;
  }

  process.stderr.write(
    `${written} specs of ${rows.length} candidates${
      written >= limit ? ` (capped at ${limit}, more remain)` : ""
    }\n`,
  );
}

main();
