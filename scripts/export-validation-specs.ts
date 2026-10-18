/**
 * Writes the install commands the sandbox should try, newest-starred first.
 *
 *   pnpm tsx scripts/export-validation-specs.ts > /tmp/specs.jsonl
 *
 * Only listings that publish a command at all: a plugin with `install: null`
 * has nothing to run, and running nothing proves nothing.
 */
import "dotenv/config";
import { and, desc, eq, isNull, ne, or, lt } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { primaryInstall } from "../lib/install";

const STALE_AFTER_DAYS = 30;

/**
 * The dsh `npm install -g @deepseek-ai/dsh` gives people today, which is what
 * the sandbox image is built from. Null when npm cannot be reached; the run
 * then still re-checks every verdict that carries no version at all.
 */
async function currentDsh(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/-/package/@deepseek-ai%2fdsh/dist-tags", {
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? ((await res.json()) as { latest?: string }).latest ?? null : null;
  } catch {
    return null;
  }
}

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

  // A verdict from another dsh is as stale as an old one: from 0.2 the
  // harness refuses what an older one installed, so when `latest` moves,
  // every verdict moves with it. Those with no version are all dsh 0.1.
  const dsh = await currentDsh();
  process.stderr.write(`current dsh: ${dsh ?? "unknown"}\n`);

  const rows = await db
    .select()
    .from(plugins)
    .where(
      and(
        eq(plugins.isArchived, false),
        status
          ? eq(plugins.installStatus, status)
          : or(
              isNull(plugins.installCheckedAt),
              lt(plugins.installCheckedAt, cutoff),
              isNull(plugins.installDshVersion),
              ...(dsh ? [ne(plugins.installDshVersion, dsh)] : []),
            )!,
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
