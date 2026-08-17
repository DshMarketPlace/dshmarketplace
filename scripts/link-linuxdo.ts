/**
 * Attaches LINUX DO threads to catalogue entries, adding the plugin first if
 * the catalogue has never seen it.
 *
 * A thread is community proof of a kind no scraper produces: a named person
 * posting their own plugin and answering for it in public. It is also a
 * two-way referral — the listing points at the discussion, the discussion
 * points back.
 *
 * Curated by hand. **Never guess a pairing**: a wrong link attributes someone
 * else's thread to a plugin they did not write. Every entry below was read on
 * the thread itself, not inferred from a title.
 *
 *   pnpm tsx scripts/link-linuxdo.ts
 *   pnpm tsx scripts/link-linuxdo.ts --dry-run
 */
import "dotenv/config";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";

type Thread = {
  /** `owner/repo`, exactly as GitHub spells it. */
  fullName: string;
  url: string;
  title: string;
  /** Only needed when the catalogue has never seen the plugin. */
  category?: string;
};

const THREADS: Thread[] = [
  {
    fullName: "zhu1090093659/dsh-web-ui#packages/dsh-web-ui-all",
    url: "https://linux.do/t/topic/2751323",
    title: "作者在 LINUX DO 自荐",
  },
  {
    fullName: "hisence999/DSH-vison",
    url: "https://linux.do/t/topic/2756216",
    title: "开源推广 · 无感识图插件",
    category: "vision",
  },
  {
    fullName: "biedongbin/dsh-claude-compat",
    url: "https://linux.do/t/topic/2755117",
    title: "开源推广 · .claude/ 目录桥接",
    category: "skill",
  },
  {
    fullName: "Mars-Sea/dsh-commandcode-provider",
    url: "https://linux.do/t/topic/2761748",
    title: "开源推广 · Command Code 接入",
    category: "model",
  },
  {
    fullName: "omdsh-dev/dsh-genui",
    url: "https://linux.do/t/topic/2751642",
    title: "开源推广 · 生成式 UI",
    category: "ui",
  },
  {
    fullName: "omdsh-dev/dsh-annotation",
    url: "https://linux.do/t/topic/2751642",
    title: "开源推广 · 选中批注",
    category: "ui",
  },
];

function slugify(fullName: string) {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function gh(path: string) {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "dshmarketplace-sync",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.ok ? res.json() : null;
}

/**
 * Plugins found through LINUX DO are recorded as `submitted`, not `registry`:
 * they reached us because someone posted them, which is a different claim from
 * having passed the community registry's review.
 */
async function ensureRow(t: Thread) {
  const [existing] = await db
    .select({ id: plugins.id })
    .from(plugins)
    .where(eq(plugins.fullName, t.fullName))
    .limit(1);

  if (existing) return { id: existing.id, created: false };

  const [owner, repo] = t.fullName.split("#")[0].split("/");
  const meta = await gh(`/repos/${owner}/${repo}`);
  if (!meta) {
    console.log(`  ✗ GitHub has no ${owner}/${repo}`);
    return null;
  }

  const now = new Date();
  const [row] = await db
    .insert(plugins)
    .values({
      fullName: t.fullName,
      owner,
      repo,
      subpath: null,
      slug: slugify(t.fullName),
      name: repo,
      repoUrl: `https://github.com/${owner}/${repo}`,
      homepageUrl: meta.homepage || null,
      summary: meta.description ?? null,
      categoryId: t.category ?? null,
      language: meta.language ?? null,
      license: meta.license?.spdx_id && meta.license.spdx_id !== "NOASSERTION"
        ? meta.license.spdx_id
        : null,
      stars: meta.stargazers_count ?? 0,
      forks: meta.forks_count ?? 0,
      openIssues: meta.open_issues_count ?? 0,
      isArchived: Boolean(meta.archived),
      repoCreatedAt: meta.created_at ? new Date(meta.created_at) : null,
      repoPushedAt: meta.pushed_at ? new Date(meta.pushed_at) : null,
      provenance: "submitted",
      inRegistry: false,
      visibility: "hidden",
      syncedAt: now,
    })
    .returning({ id: plugins.id });

  console.log(`  + added ${t.fullName} (${meta.stargazers_count}★)`);
  return { id: row.id, created: true };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();
  let linked = 0;
  let added = 0;

  for (const t of THREADS) {
    if (dryRun) {
      console.log(`  would link ${t.fullName} → ${t.url}`);
      continue;
    }

    const row = await ensureRow(t);
    if (!row) continue;
    if (row.created) added++;

    await db
      .update(plugins)
      .set({
        linuxdoUrl: t.url,
        linuxdoTitle: t.title,
        linuxdoVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(plugins.id, row.id));

    linked++;
    console.log(`  ✓ ${t.fullName} → ${t.url}`);
  }

  console.log(`\nlinked ${linked}/${THREADS.length}, added ${added} new`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
