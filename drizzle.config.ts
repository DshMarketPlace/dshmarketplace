import "dotenv/config";
import type { Config } from "drizzle-kit";

// drizzle-kit >= 0.30 folds the old `dialect: "sqlite" + driver: "turso"` pair
// into a single `dialect: "turso"`.
export default {
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
