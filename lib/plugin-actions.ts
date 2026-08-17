"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { plugins, type Visibility } from "@/db/schema";
import { scoreContent, PROMOTION_THRESHOLD } from "@/lib/plugin-scoring";

export async function setVisibility(id: number, visibility: Visibility) {
  await db
    .update(plugins)
    .set({
      visibility,
      indexedAt: visibility === "indexed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(plugins.id, id));

  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");
}

export async function saveOverview(id: number, overview: string) {
  const [row] = await db
    .select({
      overview: plugins.overview,
      readmeMd: plugins.readmeMd,
      summary: plugins.summary,
    })
    .from(plugins)
    .where(eq(plugins.id, id));

  const contentScore = scoreContent({ ...row, overview });

  await db
    .update(plugins)
    .set({ overview, contentScore, updatedAt: new Date() })
    .where(eq(plugins.id, id));

  revalidatePath("/admin");
}

/**
 * The staged rollout: promote at most `limit` pages per run, highest content
 * score first, and only above the quality threshold. Ten a day keeps the crawl
 * footprint honest and keeps any ranking movement attributable to one change.
 */
export async function promoteBatch(limit = 10) {
  const candidates = await db
    .select({ id: plugins.id, slug: plugins.slug })
    .from(plugins)
    .where(
      and(
        ne(plugins.visibility, "indexed"),
        eq(plugins.isArchived, false),
        sql`${plugins.contentScore} >= ${PROMOTION_THRESHOLD}`,
      ),
    )
    .orderBy(desc(plugins.contentScore), desc(plugins.stars))
    .limit(limit);

  const now = new Date();
  for (const c of candidates) {
    await db
      .update(plugins)
      .set({ visibility: "indexed", indexedAt: now, updatedAt: now })
      .where(eq(plugins.id, c.id));
  }

  revalidatePath("/admin");
  revalidatePath("/sitemap.xml");

  return candidates.map((c) => c.slug);
}

/** Hand-curated LINUX DO thread links, applied in bulk. */
export async function linkLinuxDoThreads(
  pairs: { fullName: string; url: string; title?: string }[],
) {
  const now = new Date();
  let updated = 0;

  for (const p of pairs) {
    const res = await db
      .update(plugins)
      .set({
        linuxdoUrl: p.url,
        linuxdoTitle: p.title ?? null,
        linuxdoVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(plugins.fullName, p.fullName));

    if (res.rowsAffected > 0) updated++;
  }

  revalidatePath("/admin");
  return updated;
}
