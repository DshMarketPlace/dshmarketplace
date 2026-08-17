import "dotenv/config";
import { db } from "../db/client";
import { plugins, categories } from "../db/schema";
import { desc, eq, count } from "drizzle-orm";

async function main() {
  const [{ total }] = await db.select({ total: count() }).from(plugins);
  console.log("插件总数:", total);

  const cats = await db
    .select({ id: categories.id, name: categories.name, n: count(plugins.id) })
    .from(categories)
    .leftJoin(plugins, eq(plugins.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(desc(count(plugins.id)));

  console.log("\n分类分布:");
  for (const c of cats)
    console.log("  " + String(c.n).padStart(4) + "  " + c.id.padEnd(9) + c.name);

  const sample = await db
    .select({ f: plugins.fullName, s: plugins.summary, z: plugins.summaryZh, c: plugins.categoryId, v: plugins.visibility })
    .from(plugins)
    .limit(3);

  console.log("\n样本:");
  for (const t of sample) {
    console.log(`  ${t.f}  [${t.c}] visibility=${t.v}`);
    console.log(`     en: ${(t.s ?? "").slice(0, 78)}`);
    console.log(`     zh: ${(t.z ?? "").slice(0, 40)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
