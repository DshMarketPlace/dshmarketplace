import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

/**
 * Turso on Cloudflare Workers.
 *
 * Three things differ from the stock Node setup and each one is fatal on
 * Workers:
 *
 *  1. The `/web` entrypoints are required. The default `@libsql/client` export
 *     pulls in node:fs and friends for local-file and embedded-replica support,
 *     neither of which exists (or is wanted) on Workers.
 *  2. The client must be built lazily. Reading credentials at module scope runs
 *     during cold start, before the request env is bound, so the throw fires on
 *     a perfectly healthy deployment.
 *  3. No `dotenv`. Wrangler feeds `.dev.vars` locally and secrets in production.
 *
 * `db` stays a drop-in for the previous eager export via a Proxy, so call sites
 * keep using `db.select()` without knowing about any of the above.
 */

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | undefined;

export function getDb(): Database {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to .dev.vars for local dev, or " +
        "`wrangler secret put TURSO_DATABASE_URL` for the deployed Worker.",
    );
  }
  if (!authToken) {
    throw new Error(
      "TURSO_AUTH_TOKEN is not set. Add it to .dev.vars for local dev, or " +
        "`wrangler secret put TURSO_AUTH_TOKEN` for the deployed Worker.",
    );
  }

  cached = drizzle(createClient({ url, authToken }), { schema });
  return cached;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
