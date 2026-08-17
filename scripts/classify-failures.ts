/**
 * Groups the listings currently published as `failed` by what the log says.
 *
 *   pnpm tsx scripts/classify-failures.ts results/*.jsonl
 *
 * Run before any batch of reviews. A verdict of `failed` is the probe's
 * catch-all, so it collects whatever no earlier branch claimed — and three
 * times now the majority of it has been our own fault rather than the
 * plugin's: a registry throttling us, a probe edited mid-run, a package the
 * harness deliberately took as a plain dependency. The tell each time was
 * uniformity. Dozens of unrelated repositories do not fail the same way.
 *
 * This reads the sandbox's own result files rather than the catalogue, because
 * the reason lives in the log and only the verdict is stored.
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { eq, and } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";

type Result = { fullName: string; status: string; log?: string };

/** Ordered: the first match wins, so put the causes that are ours on top. */
const CAUSES: Array<[string, RegExp, boolean]> = [
  ["a host throttled us — ours, not theirs", /ERR_PNPM_FETCH_(429|5\d\d)\b/, true],
  ["installed as a plain dependency, no dsh.bundle", /declares no dsh\.bundle/, true],
  ["workspace: dependency that resolves nowhere", /ERR_PNPM_WORKSPACE_PKG_NOT_FOUND/, false],
  ["link: dependency outside the package", /ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND/, false],
  ["subdependency the registry cannot serve", /ERR_PNPM_EXOTIC_SUBDEP/, false],
  ["malformed registry metadata", /ERR_PNPM_MALFORMED_METADATA/, false],
  ["package or version does not exist", /ERR_PNPM_FETCH_404|ERR_PNPM_NO_MATCHING_VERSION/, false],
  ["peer or engine refusal", /ERR_PNPM_(PEER|UNSUPPORTED)/, false],
  // A package.json saved with a UTF-8 BOM parses nowhere: pnpm cannot prepare
  // the package, or the harness throws out of `readProfileManifest` and takes
  // the command down with it. Windows editors add it invisibly.
  ["a UTF-8 BOM in package.json", /Unexpected token '﻿'/, false],
];

async function main() {
  const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!paths.length) {
    console.error("usage: pnpm tsx scripts/classify-failures.ts results.jsonl [...]");
    process.exit(1);
  }

  const live = await db
    .select({ fullName: plugins.fullName })
    .from(plugins)
    .where(and(eq(plugins.isArchived, false), eq(plugins.installStatus, "failed")));
  const wanted = new Set(live.map((r) => r.fullName));

  // Later files win: a listing re-run after a fix has a newer, truer log.
  const latest = new Map<string, Result>();
  for (const path of paths) {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (!line.trim()) continue;
      let r: Result;
      try {
        r = JSON.parse(line) as Result;
      } catch {
        continue;
      }
      if (r.status === "failed" && wanted.has(r.fullName)) latest.set(r.fullName, r);
    }
  }

  const buckets = new Map<string, { ours: boolean; names: string[] }>();
  for (const [name, r] of latest) {
    const hit = CAUSES.find(([, pattern]) => pattern.test(r.log ?? ""));
    const [label, , ours] = hit ?? ["no cause in the log", /(?:)/, true];
    const bucket = buckets.get(label) ?? { ours, names: [] };
    bucket.names.push(name);
    buckets.set(label, bucket);
  }

  const unexplained = [...wanted].filter((n) => !latest.has(n));
  const sorted = [...buckets].sort((a, b) => b[1].names.length - a[1].names.length);

  // Names are opt-in so nothing downstream has a reason to filter this output.
  // The first version indented them, callers piped it through `grep -v "^ "`,
  // and that swallowed the unexplained-cause logs below — the one thing here
  // that exists to be read.
  const names = process.argv.includes("--names");

  console.log(`${wanted.size} listings published as failed, ${latest.size} found in these files`);
  for (const [label, bucket] of sorted) {
    console.log(`${String(bucket.names.length).padStart(4)}  ${bucket.ours ? "OURS  " : "THEIRS"}  ${label}`);
    if (names) for (const n of bucket.names) console.log(`      · ${n}`);
  }

  // A cause with no pattern here is retracted, which is safe and endless: the
  // listing re-enters the queue, fails the same way tomorrow and is retracted
  // again, forever, while every run reports success. So it prints its own log
  // — the fix is one entry in CAUSES, and this is the only thing that will
  // ever ask for it.
  const nameless = buckets.get("no cause in the log");
  if (nameless) {
    console.log(`\n!! ${nameless.names.length} failures match no cause above. They will be`);
    console.log(`!! retracted and re-run nightly until CAUSES learns them:`);
    for (const n of nameless.names.slice(0, 5)) {
      const log = (latest.get(n)?.log ?? "(no log)").split("\n").slice(-8).join("\n!!   ");
      console.log(`\n!! ${n}\n!!   ${log}`);
    }
  }
  if (unexplained.length) {
    console.log(`\n${unexplained.length} have no result in these files:`);
    for (const n of unexplained) console.log(`        ${n}`);
  }

  // A gate that refuses to write a bad verdict does not remove one already
  // written, so classifying is only half of it: 31 rows kept a `failed` from
  // before the gate existed while every later run was correctly discarded.
  const ours = sorted.filter(([, b]) => b.ours).flatMap(([, b]) => b.names);
  const out = process.argv.find((a) => a.startsWith("--write-ours="))?.split("=")[1];
  if (out) {
    writeFileSync(out, ours.join("\n") + "\n");
    console.log(`\n${ours.length} of ${latest.size} are ours — written to ${out}`);
    console.log(`  pnpm tsx scripts/retract-verdicts.ts ${out}`);
  } else {
    console.log(`\n${ours.length} of ${latest.size} are ours. Retract those before writing any review.`);
  }
}

main();
