/**
 * Seeds the catalog from the awesome-dsh-plugin registry (CC0-1.0, public
 * domain — no attribution obligation; credited in NOTICE anyway).
 *
 * Everything lands at visibility "hidden": the rows exist and are browsable,
 * but no detail page is generated until the copy is worth indexing.
 *
 *   pnpm tsx scripts/seed-catalog.ts <path-to-awesome-dsh-plugin>
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import yaml from "js-yaml";

import { db } from "../db/client";
import { categories, plugins } from "../db/schema";

const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  ui: { en: "UI Enhancements", zh: "UI 增强" },
  tools: { en: "Tools & Capabilities", zh: "工具与能力" },
  dev: { en: "Development & Runtime", zh: "开发与运行时" },
  notify: { en: "Notifications & Integrations", zh: "通知与集成" },
  session: { en: "Sessions & Messages", zh: "会话与消息" },
  workflow: { en: "Workflow & Automation", zh: "工作流与自动化" },
  usage: { en: "Usage & Billing", zh: "用量与计费" },
  memory: { en: "Memory", zh: "记忆" },
  skill: { en: "Skills", zh: "技能包" },
  vision: { en: "Vision & Multimodal", zh: "视觉与多模态" },
  theme: { en: "Themes & Appearance", zh: "主题与外观" },
  fun: { en: "Just for Fun", zh: "娱乐" },
  model: { en: "Models & Providers", zh: "模型与账号接入" },
  market: { en: "Plugin Markets & Managers", zh: "插件市场与管理" },
};

/**
 * Display name for a monorepo entry. The subpath leaf is usually the plugin's
 * real name — but a repo that ships one plugin from `#plugin` or `#dsh` would
 * otherwise be titled "plugin", which is useless as an H1 and as a page title.
 * In that case the repository name is the meaningful one.
 */
const GENERIC_LEAF = new Set([
  "dsh", "plugin", "plugins", "src", "main", "index", "app",
  "core", "lib", "packages", "dist", "server", "client",
]);

export function displayName(repo: string, subpath: string | null) {
  if (!subpath) return repo;
  const leaf = subpath.split("/").pop() ?? "";
  return !leaf || GENERIC_LEAF.has(leaf.toLowerCase()) ? repo : leaf;
}

// Display order for the category rail — broad utility first, novelty last.
const CATEGORY_ORDER = [
  "tools",
  "ui",
  "dev",
  "workflow",
  "memory",
  "session",
  "skill",
  "vision",
  "model",
  "notify",
  "usage",
  "theme",
  "market",
  "fun",
];

type Entry = {
  url: string;
  name: string;
  category?: string;
  description?: { en?: string; zh?: string } | string;
};

function slugify(fullName: string) {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function descOf(d: Entry["description"], lang: "en" | "zh") {
  if (!d) return null;
  if (typeof d === "string") return lang === "en" ? d.trim() : null;
  return d[lang]?.trim() ?? null;
}

async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error("usage: tsx scripts/seed-catalog.ts <awesome-dsh-plugin dir>");
    process.exit(1);
  }

  const dir = resolve(base, "data/plugins");
  const files = readdirSync(dir).filter((f) => f.endsWith(".yml"));
  console.log(`found ${files.length} catalog entries`);

  // Categories first — plugins reference them.
  for (const [id, label] of Object.entries(CATEGORY_LABELS)) {
    const order = CATEGORY_ORDER.indexOf(id);
    await db
      .insert(categories)
      .values({
        id,
        slug: id,
        name: label.en,
        nameZh: label.zh,
        sortOrder: order === -1 ? 99 : order,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: label.en,
          nameZh: label.zh,
          sortOrder: order === -1 ? 99 : order,
        },
      });
  }
  console.log(`seeded ${Object.keys(CATEGORY_LABELS).length} categories`);

  let inserted = 0;
  let skipped = 0;
  const now = new Date();

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    let entry: Entry;
    try {
      entry = yaml.load(raw) as Entry;
    } catch (err) {
      console.warn(`skip ${file}: unparseable (${(err as Error).message})`);
      skipped++;
      continue;
    }

    if (!entry?.url || !entry?.name) {
      skipped++;
      continue;
    }

    // The catalog's `name` is "owner/repo", optionally suffixed with
    // "#subpath" when one repository publishes several plugins. That suffix is
    // part of the identity — 54 seed entries collapse into 20 rows without it.
    const [namePath, subpathRaw] = entry.name.split("#");
    const subpath = subpathRaw?.trim() || null;

    const match = entry.url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
    const owner = match?.[1] ?? namePath.split("/")[0];
    const repo = (match?.[2] ?? namePath.split("/")[1] ?? "").replace(
      /\.git$/,
      "",
    );
    if (!owner || !repo) {
      skipped++;
      continue;
    }

    const fullName = subpath ? `${owner}/${repo}#${subpath}` : `${owner}/${repo}`;
    const categoryId =
      entry.category && CATEGORY_LABELS[entry.category]
        ? entry.category
        : null;

    await db
      .insert(plugins)
      .values({
        fullName,
        owner,
        repo,
        subpath,
        slug: slugify(fullName),
        // Display name: the subpath's last segment is what the plugin is
        // actually called; the bare repo name would repeat across siblings.
        name: displayName(repo, subpath),
        repoUrl: `https://github.com/${owner}/${repo}`,
        summary: descOf(entry.description, "en"),
        summaryZh: descOf(entry.description, "zh"),
        categoryId,
        provenance: "registry",
        inRegistry: true,
        visibility: "hidden",
        syncedAt: now,
      })
      .onConflictDoUpdate({
        target: plugins.fullName,
        set: {
          summary: descOf(entry.description, "en"),
          summaryZh: descOf(entry.description, "zh"),
          categoryId,
          inRegistry: true,
          syncedAt: now,
          updatedAt: now,
        },
      });

    inserted++;
    if (inserted % 100 === 0) console.log(`  ...${inserted}`);
  }

  console.log(`\ndone: ${inserted} upserted, ${skipped} skipped`);
}

// Guarded so repair-content.ts can import displayName without re-seeding.
if (process.argv[1]?.endsWith("seed-catalog.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
