import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Kept deliberately bare for the first deploy.
 *
 * Once the base Worker is green, layer caching in one step at a time:
 *   incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" })
 * which needs the NEXT_INC_CACHE_R2_BUCKET binding in wrangler.jsonc.
 */
export default defineCloudflareConfig({});
