import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

/**
 * Where rendered pages live between requests.
 *
 * Without this the adapter has nowhere to put them, so every ISR page rendered
 * again on every request: the homepage cost 0.50s of server time against a
 * 0.23s static baseline, and 2,500 detail pages were doing the same. Their
 * content only changes when a sync job writes, which is nightly.
 *
 * `long-lived` puts a Cache API copy in front of R2, so a repeat hit in the
 * same data centre never crosses the network at all. The documented cost is
 * that an on-demand revalidation in one region can trigger a second one
 * elsewhere — which is the right trade here, because nothing revalidates on
 * demand: pages change when `sync-github.ts` or `promote.ts` runs, and the
 * deploy that follows replaces the cache anyway.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
});
