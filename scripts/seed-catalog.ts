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

import { db } from "../db/client";
import { categories, plugins } from "../db/schema";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  parseRegistryEntry,
} from "./lib/registry";

async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error(
      "usage: tsx scripts/seed-catalog.ts <awesome-dsh-plugin dir>",
    );
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
    let entry;
    try {
      entry = parseRegistryEntry(raw);
    } catch (err) {
      console.warn(`skip ${file}: unparseable (${(err as Error).message})`);
      skipped++;
      continue;
    }

    if (!entry) {
      skipped++;
      continue;
    }

    await db
      .insert(plugins)
      .values({
        fullName: entry.fullName,
        owner: entry.owner,
        repo: entry.repo,
        subpath: entry.subpath,
        slug: entry.slug,
        name: entry.name,
        repoUrl: entry.repoUrl,
        summary: entry.summary,
        summaryZh: entry.summaryZh,
        categoryId: entry.categoryId,
        provenance: "registry",
        inRegistry: true,
        visibility: "hidden",
        syncedAt: now,
      })
      .onConflictDoUpdate({
        target: plugins.fullName,
        set: {
          summary: entry.summary,
          summaryZh: entry.summaryZh,
          categoryId: entry.categoryId,
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

if (process.argv[1]?.endsWith("seed-catalog.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
