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

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("usage: apply-validations.ts <results.jsonl>");

  const rows = readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

  const now = new Date();
  const tally: Record<string, number> = {};
  let applied = 0;

  for (const r of rows) {
    tally[r.status] = (tally[r.status] ?? 0) + 1;
    // A probe that produced no verdict says nothing about the plugin; writing
    // "error" onto a listing would turn our outage into its reputation.
    if (r.status === "error") continue;

    const result = await db
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
      .where(eq(plugins.fullName, r.fullName));
    applied += Number(result.rowsAffected ?? 1);
  }

  console.log(JSON.stringify(tally, null, 2));
  console.log(`applied ${applied} of ${rows.length}`);
}

main();
