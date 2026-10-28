/**
 * The weekly report: one week of the catalogue, measured once and kept.
 *
 * `computeWeekly` reads the nightly snapshots and the sandbox verdicts and
 * returns numbers and rows only — no words, so one stored issue serves both
 * languages and both surfaces (the pages here, the Markdown post for LINUX
 * DO). Every query selects the columns it shows and nothing else: the
 * README sits mid-row in `plugins`, and a wider select drags it along.
 */
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";

import { db } from "@/db/client";
import { plugins, pluginStats, weeklyReports } from "@/db/schema";

export const WEEKLY_TOP = 10;

/** A snapshot day, as the route segment and the primary key spell it. */
export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type WeeklyRow = {
  fullName: string;
  slug: string;
  visibility: string;
  repoUrl: string;
  summary: string | null;
  summaryZh: string | null;
  metric: number;
};

/** A refused plugin, with the older release the sandbox installed instead. */
export type WeeklyRefusal = WeeklyRow & {
  npm: string | null;
  fallback: { version: string | null; status: string } | null;
};

export type WeeklyData = {
  day: string;
  from: string;
  totals: { total: number; added: number };
  releases: { version: string; day: string; tag: string | null }[];
  arrived: WeeklyRow[];
  rising: WeeklyRow[];
  installed: WeeklyRow[];
  compat: { dsh: string; tested: number; refused: number; rescued: number } | null;
  refused: WeeklyRefusal[];
};

export type WeeklyIssue = { day: string; createdAt: Date; data: WeeklyData };

/** `YYYY-MM-DD` shifted by whole days, in UTC like the snapshots themselves. */
export function shiftDay(day: string, days: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const card = {
  fullName: plugins.fullName,
  slug: plugins.slug,
  visibility: plugins.visibility,
  repoUrl: plugins.repoUrl,
  summary: plugins.summary,
  summaryZh: plugins.summaryZh,
};

/** dsh releases published in the window, from npm's own clock. */
async function dshReleases(from: string, to: string): Promise<WeeklyData["releases"]> {
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

/** Stars gained, or installs gained, between `from` and `day`. */
function weekOverWeek(day: string, from: string, field: "stars" | "installs") {
  const now = alias(pluginStats, "now");
  const before = alias(pluginStats, "before");
  const metric = sql<number>`${now[field]} - ${before[field]}`;
  return db
    .select({ ...card, metric })
    .from(now)
    .innerJoin(before, and(eq(before.pluginId, now.pluginId), eq(before.day, from)))
    .innerJoin(plugins, eq(plugins.id, now.pluginId))
    .where(and(eq(now.day, day), eq(plugins.isArchived, false), sql`${metric} > 0`))
    .orderBy(desc(metric))
    .limit(WEEKLY_TOP);
}

const asRow = <T extends { metric: number }>(r: T): T => ({ ...r, metric: Number(r.metric) });

export async function computeWeekly(day: string): Promise<WeeklyData> {
  const from = shiftDay(day, -7);
  const since = new Date(`${from}T00:00:00Z`);
  const live = eq(plugins.isArchived, false);

  const [[sizes], arrived, rising, installed, [compat], refused, releases] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        added: sql<number>`sum(case when ${plugins.createdAt} >= ${Math.floor(since.getTime() / 1000)} then 1 else 0 end)`,
      })
      .from(plugins)
      .where(live),
    db
      .select({ ...card, metric: plugins.stars })
      .from(plugins)
      .where(and(live, gte(plugins.createdAt, since)))
      .orderBy(desc(plugins.stars))
      .limit(WEEKLY_TOP),
    weekOverWeek(day, from, "stars"),
    weekOverWeek(day, from, "installs"),
    db
      .select({
        dsh: sql<string | null>`max(${plugins.installDshVersion})`,
        tested: sql<number>`sum(case when ${plugins.installStatus} in ('passed','needs-approval','failed','timeout','incompatible') then 1 else 0 end)`,
        refused: sql<number>`sum(case when ${plugins.installStatus} = 'incompatible' then 1 else 0 end)`,
        // "Of those": the same scope as getRefusalReport, or a stale fallback
        // on a plugin that now passes would count as a rescue.
        rescued: sql<number>`sum(case when ${plugins.installStatus} = 'incompatible' and json_extract(${plugins.installFallback}, '$.status') = 'passed' then 1 else 0 end)`,
      })
      .from(plugins)
      .where(and(live, isNotNull(plugins.installDshVersion))),
    db
      .select({ ...card, metric: plugins.stars, npm: plugins.npmPackage, fallback: plugins.installFallback })
      .from(plugins)
      .where(and(live, eq(plugins.installStatus, "incompatible")))
      .orderBy(desc(plugins.stars))
      .limit(WEEKLY_TOP),
    dshReleases(from, day),
  ]);

  return {
    day,
    from,
    totals: { total: Number(sizes?.total ?? 0), added: Number(sizes?.added ?? 0) },
    releases,
    arrived: arrived.map(asRow),
    rising: rising.map(asRow),
    installed: installed.map(asRow),
    compat: compat?.dsh
      ? {
          dsh: compat.dsh,
          tested: Number(compat.tested),
          refused: Number(compat.refused),
          rescued: Number(compat.rescued),
        }
      : null,
    refused: compat?.dsh
      ? refused.map((r) => {
          const f = r.fallback ? (JSON.parse(r.fallback) as { version?: string | null; status: string }) : null;
          return asRow({ ...r, fallback: f ? { version: f.version ?? null, status: f.status } : null });
        })
      : [],
  };
}

/** The newest snapshot day, which is the day a new issue would end on. */
export async function latestSnapshotDay(): Promise<string | null> {
  const [row] = await db.select({ latest: sql<string | null>`max(${pluginStats.day})` }).from(pluginStats);
  return row?.latest ?? null;
}

export async function newestIssueDay(): Promise<string | null> {
  const [row] = await db.select({ newest: sql<string | null>`max(${weeklyReports.day})` }).from(weeklyReports);
  return row?.newest ?? null;
}

/** Inserts the issue unless that day already has one. Returns whether it did. */
export async function saveWeeklyIssue(data: WeeklyData): Promise<boolean> {
  const inserted = await db
    .insert(weeklyReports)
    .values({ day: data.day, data: JSON.stringify(data) })
    .onConflictDoNothing({ target: weeklyReports.day })
    .returning({ day: weeklyReports.day });
  return inserted.length > 0;
}

/**
 * Every issue, newest first, with only what the list shows. `json_extract`
 * runs in the database so the list does not ship every issue's rows.
 */
export async function listWeeklyIssues() {
  const rows = await db
    .select({
      day: weeklyReports.day,
      createdAt: weeklyReports.createdAt,
      from: sql<string>`json_extract(${weeklyReports.data}, '$.from')`,
      total: sql<number>`json_extract(${weeklyReports.data}, '$.totals.total')`,
      added: sql<number>`json_extract(${weeklyReports.data}, '$.totals.added')`,
    })
    .from(weeklyReports)
    .orderBy(desc(weeklyReports.day));
  return rows.map((r) => ({ ...r, total: Number(r.total), added: Number(r.added) }));
}

export async function getWeeklyIssue(day: string): Promise<WeeklyIssue | null> {
  if (!DAY_PATTERN.test(day)) return null;
  const [row] = await db.select().from(weeklyReports).where(eq(weeklyReports.day, day)).limit(1);
  return row ? { day: row.day, createdAt: row.createdAt, data: JSON.parse(row.data) as WeeklyData } : null;
}
