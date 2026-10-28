/**
 * A week of the catalogue as a post: what arrived, what climbed, what people
 * installed, and what the current DeepSeek Harness refuses.
 *
 *   pnpm tsx scripts/weekly-report.ts [--day YYYY-MM-DD] [--lang zh|en] > weekly.md
 *   pnpm tsx scripts/weekly-report.ts --save [--if-due] [--day YYYY-MM-DD]
 *
 * Written for the places the ecosystem gathers (LINUX DO, the harness's own
 * Discussions) and, with `--save`, kept as an issue at /weekly/<day>. Every
 * number is a measurement from the nightly snapshots or the sandbox — nothing
 * here is written by a model.
 *
 * `--save` stores the issue for that day unless one exists; a stored issue is
 * never overwritten, because a published week must not change. `--if-due`
 * (the nightly) computes nothing unless the newest issue is a week old.
 * Without `--save` the Markdown goes to stdout and the database is only read.
 */
import "dotenv/config";

import { computeWeekly, DAY_PATTERN, latestSnapshotDay, newestIssueDay, saveWeeklyIssue } from "../lib/weekly";
import { isWeeklyDue } from "./lib/weekly-due";
import { renderWeeklyMarkdown } from "./lib/weekly-markdown";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const flag = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const lang = arg("lang") === "en" ? "en" : "zh";
  const latest = await latestSnapshotDay();
  const day = arg("day") ?? latest;
  if (!day || !DAY_PATTERN.test(day)) throw new Error(`no snapshot day to report on (got ${day ?? "none"})`);

  if (!flag("save")) {
    process.stdout.write(renderWeeklyMarkdown(await computeWeekly(day), lang));
    return;
  }

  // The totals, the compatibility counts and "new this week" read the
  // catalogue as it is now, so only the newest snapshot day can be stored
  // truthfully. An older --day is fine for a draft post, not for the record.
  if (day !== latest) throw new Error(`--save only stores the latest snapshot day (${latest}), not ${day}`);

  if (flag("if-due")) {
    const newest = await newestIssueDay();
    if (!isWeeklyDue(day, newest)) {
      console.log(`weekly: not due (newest issue ${newest}, latest snapshot ${day})`);
      return;
    }
  }
  const saved = await saveWeeklyIssue(await computeWeekly(day));
  console.log(saved ? `weekly: saved the issue for ${day}` : `weekly: ${day} already has an issue; left it as it was`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
