/**
 * A page is only worth indexing if it says something a scraped card does not.
 * This gate is what keeps the catalog from becoming a thousand near-identical
 * template pages, which is the fastest route to a scaled-content demotion.
 *
 * Kept out of the "use server" module: those may only export async functions,
 * and a scoring rule has no business being an RPC endpoint.
 */
export const PROMOTION_THRESHOLD = 70;

/**
 * Weighted so that no page can reach the threshold on imported material
 * alone. A plugin with a long README, a good upstream summary and nothing
 * written for it tops out at 20 — everything above that has to be earned by
 * copy that exists nowhere else.
 */
export function scoreContent(p: {
  overview: string | null;
  overviewZh?: string | null;
  docs?: string | null;
  readmeMd: string | null;
  summary: string | null;
  illustration?: string | null;
}) {
  let score = 0;
  if (p.summary && p.summary.length >= 60) score += 10;
  // The imported README counts for very little on its own: every competing
  // directory scraped the same bytes, so it adds no reason to rank this page.
  if (p.readmeMd && p.readmeMd.length >= 600) score += 10;
  if (p.overview) score += 25;
  if (p.overview && p.overview.length >= 900) score += 10;
  if (p.overviewZh) score += 20;
  if (p.docs && p.docs.length >= 600) score += 15;
  if (p.illustration) score += 10;
  return Math.min(100, score);
}
