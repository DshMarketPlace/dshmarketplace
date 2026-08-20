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

  // `--status <verdict>` re-runs one class of result regardless of how recently
  // it was checked. The nightly filter is "unchecked or stale", which is right
  // when the plugins move and wrong when *the sandbox* moves: pnpm 11 turned a
  // blocked build script into a failed install, so 311 rows were recorded as
  // needs-approval by an interpreter we had not meant to use. Nothing about
  // those listings is stale, and every one of them needs running again.
  const statusFlag = process.argv.indexOf("--status");
  const status = statusFlag === -1 ? null : process.argv[statusFlag + 1];

  const rows = await db
    .select()
    .from(plugins)
    .where(
      and(
        eq(plugins.isArchived, false),
        status
          ? eq(plugins.installStatus, status)
          : or(isNull(plugins.installCheckedAt), lt(plugins.installCheckedAt, cutoff))!,
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
