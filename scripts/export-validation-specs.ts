/**
 * Writes the install commands the sandbox should try, newest-starred first.
 *
 *   pnpm tsx scripts/export-validation-specs.ts > /tmp/specs.jsonl
 *
 * Only listings that publish a command at all: a plugin with `install: null`
 * has nothing to run, and running nothing proves nothing.
 *
 *   pnpm tsx scripts/export-validation-specs.ts --preview alpha --limit 150
 *
 * writes the upgrade check's batch instead — see `exportPreview`.
 */
import "dotenv/config";
import { and, desc, eq, gt, inArray, isNull, ne, or, lt, sql } from "drizzle-orm";

import { db } from "../db/client";
import { compatRuns, plugins } from "../db/schema";
import { PREVIEW_TAGS, isPreviewTag, pickPreviewCandidates, tagsToPreview } from "../lib/compat-summary";
import { primaryInstall } from "../lib/install";

const STALE_AFTER_DAYS = 30;

/**
 * The dsh `npm install -g @deepseek-ai/dsh` gives people today, which is what
 * the sandbox image is built from. Null when npm cannot be reached; the run
 * then still re-checks every verdict that carries no version at all.
 */
async function currentDsh(): Promise<string | null> {
  return (await distTags())?.latest ?? null;
}

async function distTags(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/-/package/@deepseek-ai%2fdsh/dist-tags", {
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? ((await res.json()) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

/**
 * `--preview <next|alpha>`: plugins that pass on `latest`, to install on an
 * upcoming dsh — the upgrade check. Least recently checked on that tag's
 * current release first, then by installs and stars, so a nightly cap still
 * cycles the whole passed set. Writes nothing when the tag is the same
 * release as `latest`: the nightly verdicts already measure that one.
 *
 * Reads the pool off covering indexes (plugins_search_status_idx,
 * plugins_install_count_idx) and only the chosen rows' install fields, so the
 * README never comes along (CLAUDE.md rule 7).
 */
async function exportPreview(tag: string, limit: number) {
  if (!isPreviewTag(tag)) throw new Error(`--preview takes one of ${PREVIEW_TAGS.join(", ")}`);
  const tags = await distTags();
  if (!tags) throw new Error("npm dist-tags unreachable; refusing to guess which dsh a tag is");
  const target = tagsToPreview(tags).find((t) => t.tag === tag);
  process.stderr.write(`dsh ${tag}: ${tags[tag] ?? "none"}, latest: ${tags.latest ?? "none"}\n`);
  if (!target) {
    process.stderr.write(`0 specs: ${tag} is missing or the same release as latest\n`);
    return;
  }

  const [pool, installs, checked] = await Promise.all([
    db
      .select({ id: plugins.id, fullName: plugins.fullName, stars: plugins.stars })
      .from(plugins)
      .where(and(eq(plugins.isArchived, false), eq(plugins.installStatus, "passed"))),
    db
      .select({ id: plugins.id, installs: plugins.installCount })
      .from(plugins)
      .where(and(eq(plugins.isArchived, false), gt(plugins.installCount, 0))),
    db
      .select({ fullName: compatRuns.fullName, ranAt: sql<number>`max(${compatRuns.ranAt})` })
      .from(compatRuns)
      .where(and(eq(compatRuns.dshTag, tag), eq(compatRuns.dshVersion, target.version)))
      .groupBy(compatRuns.fullName),
  ]);
  const installsById = new Map(installs.map((r) => [r.id, r.installs]));
  const lastChecked = new Map(checked.map((r) => [r.fullName, Number(r.ranAt)]));

  const chosen = pickPreviewCandidates(
    pool.map((p) => ({
      fullName: p.fullName,
      stars: p.stars,
      installs: installsById.get(p.id) ?? 0,
      lastChecked: lastChecked.get(p.fullName) ?? null,
    })),
    Number.isFinite(limit) ? limit : 150,
  );

  const fields = new Map<string, Parameters<typeof primaryInstall>[0]>();
  const names = chosen.map((c) => c.fullName);
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
    for (const r of rows) fields.set(r.fullName, r);
  }

  let written = 0;
  for (const name of names) {
    const row = fields.get(name);
    const cmd = row ? primaryInstall(row)?.cmd : undefined;
    if (!cmd) continue;
    process.stdout.write(JSON.stringify({ fullName: name, install: cmd }) + "\n");
    written++;
  }
  process.stderr.write(
    `${written} preview specs for ${tag} (${target.version}) of ${pool.length} passed, ` +
      `${lastChecked.size} already checked on this release\n`,
  );
}

async function main() {
  const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 86_400_000);
  // A nightly run should cost minutes, not hours: after the first sweep the
  // only candidates are new listings and ones whose command changed. The cap
  // keeps a backlog from turning one night's run into a six-hour job.
  const flag = process.argv.indexOf("--limit");
  const limit = flag === -1 ? Infinity : Number(process.argv[flag + 1]);

  const previewFlag = process.argv.indexOf("--preview");
  if (previewFlag !== -1) return exportPreview(process.argv[previewFlag + 1] ?? "", limit);

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

  // Only what `primaryInstall` reads. The full row drags the stored README
  // along, and once every 0.1-era verdict became a candidate that was ~12,000
  // rows of it in one response — Turso closed the socket mid-transfer.
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
