/**
 * A week of the catalogue as a post: what arrived, what climbed, what people
 * installed, and what the current DeepSeek Harness refuses.
 *
 *   pnpm tsx scripts/weekly-report.ts [--day YYYY-MM-DD] [--lang zh|en] > weekly.md
 *
 * Written for the places the ecosystem gathers (LINUX DO, the harness's own
 * Discussions), not for this site: a directory that only waits to be found is
 * the plateau this was built to get past. Every number is a measurement from
 * the nightly snapshots or the sandbox — nothing here is written by a model.
 */
import "dotenv/config";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "../db/client";
import { plugins, pluginStats } from "../db/schema";

const SITE = "https://dshmarketplace.dev";
const TOP = 10;

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function shiftDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type Row = {
  fullName: string;
  slug: string;
  visibility: string;
  repoUrl: string;
  summary: string | null;
  summaryZh: string | null;
};

const link = (p: Row) =>
  p.visibility === "hidden" ? p.repoUrl : `${SITE}/plugins/${p.slug}`;

const card = {
  fullName: plugins.fullName,
  slug: plugins.slug,
  visibility: plugins.visibility,
  repoUrl: plugins.repoUrl,
  summary: plugins.summary,
  summaryZh: plugins.summaryZh,
};

/** dsh releases published in the window, from npm's own clock. */
async function dshReleases(from: string, to: string) {
  try {
    const res = await fetch("https://registry.npmjs.org/@deepseek-ai%2fdsh");
    const doc = (await res.json()) as { time: Record<string, string>; "dist-tags": Record<string, string> };
    const tags = Object.fromEntries(Object.entries(doc["dist-tags"]).map(([t, v]) => [v, t]));
    return Object.entries(doc.time)
      .filter(([v, at]) => /^\d/.test(v) && at.slice(0, 10) > from && at.slice(0, 10) <= to)
      .map(([v, at]) => ({ version: v, day: at.slice(0, 10), tag: tags[v] ?? null }));
  } catch {
    return [];
  }
}

async function main() {
  const lang = arg("lang") === "en" ? "en" : "zh";
  const [{ latest }] = await db.select({ latest: sql<string>`max(${pluginStats.day})` }).from(pluginStats);
  const day = arg("day") ?? latest;
  const weekAgo = shiftDay(day, -7);
  const since = new Date(`${weekAgo}T00:00:00Z`);

  const now = alias(pluginStats, "now");
  const before = alias(pluginStats, "before");
  const gain = sql<number>`${now.stars} - ${before.stars}`;
  const installsGained = sql<number>`${now.installs} - ${before.installs}`;
  const pair = (metric: typeof gain) =>
    db
      .select({ ...card, metric })
      .from(now)
      .innerJoin(before, and(eq(before.pluginId, now.pluginId), eq(before.day, weekAgo)))
      .innerJoin(plugins, eq(plugins.id, now.pluginId))
      .where(and(eq(now.day, day), eq(plugins.isArchived, false), sql`${metric} > 0`))
      .orderBy(desc(metric))
      .limit(TOP);

  const [[sizes], arrived, rising, installed, [compat], refused, releases] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        added: sql<number>`sum(case when ${plugins.createdAt} >= ${Math.floor(since.getTime() / 1000)} then 1 else 0 end)`,
      })
      .from(plugins)
      .where(eq(plugins.isArchived, false)),
    db
      .select({ ...card, metric: plugins.stars })
      .from(plugins)
      .where(and(eq(plugins.isArchived, false), gte(plugins.createdAt, since)))
      .orderBy(desc(plugins.stars))
      .limit(TOP),
    pair(gain),
    pair(installsGained),
    db
      .select({
        dsh: sql<string | null>`max(${plugins.installDshVersion})`,
        tested: sql<number>`sum(case when ${plugins.installStatus} in ('passed','needs-approval','failed','timeout','incompatible') then 1 else 0 end)`,
        refused: sql<number>`sum(case when ${plugins.installStatus} = 'incompatible' then 1 else 0 end)`,
        rescued: sql<number>`sum(case when json_extract(${plugins.installFallback}, '$.status') = 'passed' then 1 else 0 end)`,
      })
      .from(plugins)
      .where(and(eq(plugins.isArchived, false), isNotNull(plugins.installDshVersion))),
    db
      .select({ ...card, metric: plugins.stars, npm: plugins.npmPackage, fallback: plugins.installFallback })
      .from(plugins)
      .where(and(eq(plugins.isArchived, false), eq(plugins.installStatus, "incompatible")))
      .orderBy(desc(plugins.stars))
      .limit(TOP),
    dshReleases(weekAgo, day),
  ]);

  const zh = lang === "zh";
  const say = (p: Row) => (zh ? (p.summaryZh ?? p.summary) : p.summary) ?? "";
  const list = (rows: (Row & { metric: number })[], unit: (n: number) => string) =>
    rows.length
      ? rows
          .map((p, i) => `${i + 1}. [${p.fullName}](${link(p)}) — ${unit(Number(p.metric))}${say(p) ? `\n   ${say(p)}` : ""}`)
          .join("\n")
      : zh
        ? "（本周没有）"
        : "(none this week)";

  const out: string[] = [];
  out.push(
    zh
      ? `# DeepSeek Harness 插件周报 · ${weekAgo} → ${day}`
      : `# DeepSeek Harness plugins this week · ${weekAgo} → ${day}`,
    "",
    zh
      ? `目录现有 ${Number(sizes.total).toLocaleString()} 个插件，本周新收录 ${Number(sizes.added).toLocaleString()} 个。数字都来自 ${SITE} 的夜间快照和 sandbox 实测，不是估的。`
      : `${Number(sizes.total).toLocaleString()} plugins in the catalogue, ${Number(sizes.added).toLocaleString()} added this week. Every number comes from the nightly snapshots and sandbox runs at ${SITE}.`,
    "",
  );
  if (releases.length) {
    out.push(zh ? "## 本周 DeepSeek Harness 发版" : "## DeepSeek Harness releases this week", "");
    for (const r of releases) out.push(`- \`${r.version}\` · ${r.day}${r.tag ? ` · npm \`${r.tag}\`` : ""}`);
    out.push("");
  }
  out.push(zh ? "## 本周新收录（按 Star）" : "## New this week, by stars", "", list(arrived, (n) => `★ ${n}`), "");
  out.push(zh ? "## 本周涨 Star 最多" : "## Most stars gained", "", list(rising, (n) => `+${n} ★`), "");
  out.push(
    zh ? "## 本周在 DeepSeek Harness 里被安装最多" : "## Most installed from inside DeepSeek Harness",
    "",
    list(installed, (n) => (zh ? `${n} 次` : `${n} installs`)),
    "",
  );
  if (compat?.dsh) {
    out.push(
      zh ? `## DeepSeek Harness ${compat.dsh} 兼容情况` : `## Compatibility with DeepSeek Harness ${compat.dsh}`,
      "",
      zh
        ? `已在 ${compat.dsh} 上实测 ${Number(compat.tested).toLocaleString()} 个，其中 ${Number(compat.refused).toLocaleString()} 个最新版被拒，${Number(compat.rescued).toLocaleString()} 个有能装的旧版。装不上先看 ${SITE}/zh/install-failed ，或者直接 \`npx dshmarketplace-cli add <插件>\`，它会按你本机的 dsh 挑版本。`
        : `${Number(compat.tested).toLocaleString()} plugins run on ${compat.dsh}: ${Number(compat.refused).toLocaleString()} had their latest release refused, ${Number(compat.rescued).toLocaleString()} of those have an older release that installs. If one will not install, see ${SITE}/install-failed — or run \`npx dshmarketplace-cli add <plugin>\`, which picks a release your dsh accepts.`,
      "",
    );
    for (const p of refused) {
      const f = p.fallback ? (JSON.parse(p.fallback) as { version: string | null; status: string }) : null;
      const fix =
        f?.status === "passed" && p.npm && f.version
          ? `\`${p.npm}@${f.version}\``
          : zh
            ? "暂无能装的版本"
            : "no release fits yet";
      out.push(`- [${p.fullName}](${link(p)}) → ${fix}`);
    }
    out.push("");
  }
  process.stdout.write(out.join("\n") + "\n");
}

main();
