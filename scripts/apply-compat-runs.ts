/**
 * Records the upgrade check's sandbox runs.
 *
 *   pnpm tsx scripts/apply-compat-runs.ts --tag alpha preview-results-alpha.jsonl
 *
 * Writes compat_runs and nothing else. A preview is not a verdict the
 * catalogue publishes: `plugins.install_*` and `install_runs` describe npm
 * `latest`, retraction reads them, and a run on a release most people do not
 * have must never reach a listing. Applying a file twice appends twice — the
 * newest row per (plugin, tag) is what is read, so that only costs rows.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { inArray } from "drizzle-orm";

import { db } from "../db/client";
import { compatRuns, plugins } from "../db/schema";
import { isPreviewTag, previewRejection, PREVIEW_TAGS, type PreviewResult } from "../lib/compat-summary";
import { primaryInstall } from "../lib/install";
import { persist } from "./lib/persist";

type Row = PreviewResult & { detail?: string | null; dshVersion?: string | null };

async function currentCommands(names: string[]): Promise<Map<string, string | undefined>> {
  const out = new Map<string, string | undefined>();
  // Only the batch's own rows, and only what `primaryInstall` reads.
  for (let i = 0; i < names.length; i += 200) {
    const rows = await db
      .select({
        fullName: plugins.fullName,
        owner: plugins.owner,
        repo: plugins.repo,
        subpath: plugins.subpath,
        npmPackage: plugins.npmPackage,
        installKind: plugins.installKind,
      })
      .from(plugins)
      .where(inArray(plugins.fullName, names.slice(i, i + 200)));
    for (const r of rows) out.set(r.fullName, primaryInstall(r)?.cmd);
  }
  return out;
}

async function main() {
  const flag = process.argv.indexOf("--tag");
  const tag = flag === -1 ? "" : (process.argv[flag + 1] ?? "");
  const path = process.argv.slice(2).filter((a, i, all) => a !== "--tag" && all[i - 1] !== "--tag")[0];
  if (!isPreviewTag(tag) || !path) {
    throw new Error(`usage: apply-compat-runs.ts --tag <${PREVIEW_TAGS.join("|")}> <results.jsonl>`);
  }

  const rows: Row[] = readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const current = await currentCommands([...new Set(rows.map((r) => r.fullName ?? "").filter(Boolean))]);

  const now = new Date();
  const tally: Record<string, number> = {};
  const values: (typeof compatRuns.$inferInsert)[] = [];
  for (const r of rows) {
    const reason = previewRejection(r, r.fullName ? current.get(r.fullName) : undefined);
    const key = reason ? `skipped:${reason}` : (r.status as string);
    tally[key] = (tally[key] ?? 0) + 1;
    if (reason) continue;
    values.push({
      fullName: r.fullName as string,
      dshTag: tag,
      dshVersion: r.dshVersion as string,
      install: r.install ?? null,
      status: r.status as string,
      detail: r.detail ? String(r.detail).slice(0, 2000) : null,
      ranAt: now,
    });
  }

  for (let i = 0; i < values.length; i += 50) {
    const chunk = values.slice(i, i + 50);
    await persist(() => db.insert(compatRuns).values(chunk));
  }

  const versions = [...new Set(values.map((v) => v.dshVersion))].join(", ") || "none";
  console.log(JSON.stringify(tally, null, 2));
  console.log(`recorded ${values.length} of ${rows.length} runs on ${tag} (dsh ${versions})`);
}

main();
