/**
 * Reconciles the database with a checked-out awesome-dsh-plugin registry.
 *
 * Safe defaults matter here: a temporary upstream checkout problem must not
 * remove thousands of listings. Normal runs only add or update rows. Registry
 * removals require the explicit --apply-removals flag.
 *
 *   pnpm tsx scripts/sync-registry.ts <awesome-dsh-plugin dir> [--dry-run]
 *   pnpm tsx scripts/sync-registry.ts <dir> --only owner/repo [--dry-run]
 */
import "dotenv/config";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { categories, plugins } from "../db/schema";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  parseRegistryEntry,
  type RegistryPlugin,
} from "./lib/registry";

const MIN_COMPLETE_REGISTRY_SIZE = 1_000;
const MAX_LOGGED_CHANGES = 30;

type ExistingPlugin = {
  id: number;
  fullName: string;
  slug: string;
  summary: string | null;
  summaryZh: string | null;
  categoryId: string | null;
  inRegistry: boolean;
};

type Change =
  | { kind: "insert"; entry: RegistryPlugin }
  | {
      kind: "update";
      row: ExistingPlugin;
      entry: RegistryPlugin;
      fields: string[];
    }
  | { kind: "remove"; row: ExistingPlugin };

function readArg(argv: string[], name: string) {
  const at = argv.indexOf(name);
  if (at === -1) return null;
  const value = argv[at + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(name + " requires a value");
  }
  return value;
}

function readRegistry(base: string) {
  const dir = resolve(base, "data/plugins");
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".yml"))
    .sort();
  const entries: RegistryPlugin[] = [];
  const errors: string[] = [];
  const names = new Set<string>();
  const slugs = new Map<string, string>();

  for (const file of files) {
    const path = join(dir, file);
    if (!lstatSync(path).isFile()) {
      errors.push(file + ": not a regular file");
      continue;
    }

    try {
      const entry = parseRegistryEntry(readFileSync(path, "utf8"));
      if (!entry) {
        errors.push(file + ": missing or invalid url/name");
        continue;
      }

      const key = entry.fullName.toLowerCase();
      if (names.has(key)) {
        errors.push(file + ": duplicate plugin " + entry.fullName);
        continue;
      }
      names.add(key);

      const slugOwner = slugs.get(entry.slug);
      if (slugOwner) {
        errors.push(
          file + ": slug " + entry.slug + " also belongs to " + slugOwner,
        );
        continue;
      }
      slugs.set(entry.slug, entry.fullName);
      entries.push(entry);
    } catch (error) {
      errors.push(file + ": " + (error as Error).message);
    }
  }

  if (errors.length) {
    throw new Error(
      "Registry validation failed:\n" + errors.slice(0, 20).join("\n"),
    );
  }
  if (entries.length < MIN_COMPLETE_REGISTRY_SIZE) {
    throw new Error(
      "Registry snapshot has only " +
        entries.length +
        " valid entries; refusing an incomplete checkout",
    );
  }
  return entries;
}

function changedFields(row: ExistingPlugin, entry: RegistryPlugin) {
  const fields: string[] = [];
  if (!row.inRegistry) fields.push("inRegistry");
  if (entry.summary !== null && entry.summary !== row.summary) {
    fields.push("summary");
  }
  if (entry.summaryZh !== null && entry.summaryZh !== row.summaryZh) {
    fields.push("summaryZh");
  }
  if (entry.categoryId !== null && entry.categoryId !== row.categoryId) {
    fields.push("categoryId");
  }
  return fields;
}

function printChanges(changes: Change[]) {
  for (const change of changes.slice(0, MAX_LOGGED_CHANGES)) {
    if (change.kind === "insert") {
      console.log("  + " + change.entry.fullName);
    } else if (change.kind === "update") {
      console.log(
        "  ~ " + change.entry.fullName + ": " + change.fields.join(", "),
      );
    } else {
      console.log("  - " + change.row.fullName + ": inRegistry");
    }
  }
  if (changes.length > MAX_LOGGED_CHANGES) {
    console.log("  ...and " + (changes.length - MAX_LOGGED_CHANGES) + " more");
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const base = argv.find((arg) => !arg.startsWith("--"));
  if (!base) {
    throw new Error(
      "usage: tsx scripts/sync-registry.ts <awesome-dsh-plugin dir> [--dry-run] [--only owner/repo] [--apply-removals]",
    );
  }

  const dryRun = argv.includes("--dry-run");
  const applyRemovals = argv.includes("--apply-removals");
  const only = readArg(argv, "--only");
  if (only && applyRemovals) {
    throw new Error("--apply-removals cannot be combined with --only");
  }

  const allEntries = readRegistry(base);
  const upstreamNames = new Set(
    allEntries.map((entry) => entry.fullName.toLowerCase()),
  );
  const selectedEntries = only
    ? allEntries.filter(
        (entry) => entry.fullName.toLowerCase() === only.toLowerCase(),
      )
    : allEntries;
  if (only && selectedEntries.length !== 1) {
    throw new Error(only + " was not found in the registry snapshot");
  }

  const existing = await db
    .select({
      id: plugins.id,
      fullName: plugins.fullName,
      slug: plugins.slug,
      summary: plugins.summary,
      summaryZh: plugins.summaryZh,
      categoryId: plugins.categoryId,
      inRegistry: plugins.inRegistry,
    })
    .from(plugins);
  const existingByName = new Map(
    existing.map((row) => [row.fullName.toLowerCase(), row]),
  );
  const existingBySlug = new Map(existing.map((row) => [row.slug, row]));
  const changes: Change[] = [];

  for (const entry of selectedEntries) {
    const row = existingByName.get(entry.fullName.toLowerCase());
    if (!row) {
      const slugOwner = existingBySlug.get(entry.slug);
      if (slugOwner) {
        throw new Error(
          "Cannot insert " +
            entry.fullName +
            ": slug already belongs to " +
            slugOwner.fullName,
        );
      }
      changes.push({ kind: "insert", entry });
      continue;
    }

    const fields = changedFields(row, entry);
    if (fields.length) changes.push({ kind: "update", row, entry, fields });
  }

  if (!only) {
    for (const row of existing) {
      if (row.inRegistry && !upstreamNames.has(row.fullName.toLowerCase())) {
        changes.push({ kind: "remove", row });
      }
    }
  }

  const inserts = changes.filter((change) => change.kind === "insert");
  const updates = changes.filter((change) => change.kind === "update");
  const removals = changes.filter((change) => change.kind === "remove");
  console.log(
    "registry " +
      allEntries.length +
      "; insert " +
      inserts.length +
      ", update " +
      updates.length +
      ", detected removals " +
      removals.length,
  );
  printChanges(changes);

  if (dryRun) {
    console.log("dry-run: no database writes");
    return;
  }

  const now = new Date();
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
          updatedAt: now,
        },
      });
  }

  for (const change of inserts) {
    const entry = change.entry;
    await db.insert(plugins).values({
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
    });
  }

  for (const change of updates) {
    const entry = change.entry;
    await db
      .update(plugins)
      .set({
        inRegistry: true,
        summary: entry.summary ?? change.row.summary,
        summaryZh: entry.summaryZh ?? change.row.summaryZh,
        categoryId: entry.categoryId ?? change.row.categoryId,
        updatedAt: now,
      })
      .where(eq(plugins.id, change.row.id));
  }

  if (applyRemovals) {
    for (const change of removals) {
      await db
        .update(plugins)
        .set({ inRegistry: false, updatedAt: now })
        .where(eq(plugins.id, change.row.id));
    }
  } else if (removals.length) {
    console.warn(
      "removals were not applied; inspect them and use --apply-removals explicitly",
    );
  }

  console.log(
    "done: " +
      inserts.length +
      " inserted, " +
      updates.length +
      " updated, " +
      (applyRemovals ? removals.length : 0) +
      " removals applied",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
