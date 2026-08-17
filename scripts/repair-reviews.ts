/**
 * Re-normalises and re-renders stored reviews without calling the model.
 *
 *   pnpm tsx scripts/repair-reviews.ts [--dry]
 *
 * A prompt fix only reaches reviews written after it. Regenerating the whole
 * catalogue to correct typography would cost hours and change every paragraph,
 * when the defect is a handful of characters — so the markdown already stored
 * is repaired in place and re-rendered. Only rows whose text actually changes
 * are written, and `reviewedAt` is left alone: nothing about the judgement
 * moved, so nothing downstream should think it did.
 */
import "dotenv/config";
import { eq, and, isNotNull } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { joinIdentifiers } from "./lib/text";
import { persist } from "./lib/persist";

function toHtml(md: string) {
  return sanitizeHtml(marked.parse(md, { async: false }) as string, {
    allowedTags: ["p", "strong", "em", "code", "br"],
    allowedAttributes: {},
  });
}

async function main() {
  const dry = process.argv.includes("--dry");

  const rows = await db
    .select({
      fullName: plugins.fullName,
      en: plugins.review,
      zh: plugins.reviewZh,
    })
    .from(plugins)
    .where(and(eq(plugins.isArchived, false), isNotNull(plugins.reviewZh)));

  let changed = 0;
  for (const row of rows) {
    const en = row.en ? joinIdentifiers(row.en, "en") : row.en;
    const zh = row.zh ? joinIdentifiers(row.zh, "zh") : row.zh;
    if (en === row.en && zh === row.zh) continue;
    changed++;

    if (dry) {
      const before = (row.zh ?? row.en ?? "").match(/[^\n]{0,24}[A-Za-z0-9] [.-] [^\n]{0,24}/);
      console.log(`  ${row.fullName}\n    ${JSON.stringify(before?.[0] ?? "")}`);
      continue;
    }

    await persist(() =>
      db
        .update(plugins)
        .set({
          review: en,
          reviewZh: zh,
          reviewHtml: en ? toHtml(en) : null,
          reviewHtmlZh: zh ? toHtml(zh) : null,
          updatedAt: new Date(),
        })
        .where(eq(plugins.fullName, row.fullName)),
    );
  }

  console.log(`${changed} of ${rows.length} reviews ${dry ? "would be" : "were"} repaired`);
}

main();
