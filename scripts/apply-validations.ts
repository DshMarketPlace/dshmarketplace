/**
 * Folds sandbox verdicts into the catalogue.
 *
 *   pnpm tsx scripts/apply-validations.ts results.jsonl
 *
 * Separate from the runner on purpose: the machine that executes untrusted
 * install scripts holds no database credentials, so the results cross as a
 * file and are applied from here.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { primaryInstall } from "../lib/install";
import { persist } from "./lib/persist";

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("usage: apply-validations.ts <results.jsonl>");

  const rows = readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  // What each listing publishes *now*. A batch takes hours, and
  // `repair-npm-claims.ts` retracted 412 commands while this one was running.
  const current = new Map<string, string | undefined>();
  for (const p of await db.select().from(plugins)) {
    current.set(p.fullName, primaryInstall(p)?.cmd);
  }

  const now = new Date();
  const tally: Record<string, number> = {};
  let applied = 0;
  let stale = 0;
  let throttled = 0;

  for (const r of rows) {
    tally[r.status] = (tally[r.status] ?? 0) + 1;
    // A probe that produced no verdict says nothing about the plugin; writing
    // "error" onto a listing would turn our outage into its reputation.
    if (r.status === "error") continue;

    // Neither does a run a host refused to serve. 119 listings came back
    // "failed" with ERR_PNPM_FETCH_429 — npm throttling us, partly because an
    // npm-claim audit had just made a thousand requests of its own — and 28
    // more from codeload.github.com, which rate limits tarball downloads the
    // same way. Whose 429 it is never matters; it measures our traffic, and
    // publishing it marks working plugins broken. Checked here rather than
    // only in the probe because this is the last gate before a verdict becomes
    // something a reader sees.
    if (/ERR_PNPM_FETCH_(429|5\d\d)\b/.test(r.log ?? "")) {
      throttled++;
      continue;
    }

    // A verdict is only about the command that was run. When the listing has
    // since changed — an npm name we retracted because it was never published,
    // or was somebody else's — the old result describes a command we no longer
    // publish, and applying it would blame this repository for a package it
    // never shipped.
    if (r.install && current.get(r.fullName) !== r.install) {
      stale++;
      continue;
    }

    const result = await persist(() =>
      db
        .update(plugins)
        .set({
          installStatus: r.status,
          installDetail: r.detail ?? null,
          blockedBuilds: r.blockedBuildScripts?.length
            ? JSON.stringify(r.blockedBuildScripts)
            : null,
          installCheckedAt: now,
          updatedAt: now,
        })
        .where(eq(plugins.fullName, r.fullName)),
    );
    applied += Number(result.rowsAffected ?? 1);
  }

  console.log(JSON.stringify(tally, null, 2));
  console.log(
    `applied ${applied} of ${rows.length}, ${stale} stale (command changed), ` +
      `${throttled} discarded (registry throttled the run)`,
  );
}

main();
