import { asc, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { plugins } from "@/db/schema";

/**
 * Read-only admin queries. Deliberately not in the "use server" module — an
 * exported async function there becomes a callable server action, and the
 * rollout queue is not something to expose as an RPC endpoint.
 */

export async function getAdminQueue(limit = 60) {
  return db
    .select({
      id: plugins.id,
      fullName: plugins.fullName,
      slug: plugins.slug,
      stars: plugins.stars,
      visibility: plugins.visibility,
      contentScore: plugins.contentScore,
      hasOverview: isNotNull(plugins.overview),
      linuxdoUrl: plugins.linuxdoUrl,
    })
    .from(plugins)
    .where(eq(plugins.isArchived, false))
    .orderBy(desc(plugins.contentScore), desc(plugins.stars))
    .limit(limit);
}

export async function getVisibilityCounts() {
  return db
    .select({ visibility: plugins.visibility, n: sql<number>`count(*)` })
    .from(plugins)
    .groupBy(plugins.visibility)
    .orderBy(asc(plugins.visibility));
}
