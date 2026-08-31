/**
 * Discovers plugins from the GitHub topics and admits the ones that really are
 * DSH plugins.
 *
 *   GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/ingest-topic.ts
 *   ... --dry-run          report what would be admitted, write nothing
 *   ... --limit 200        stop after N candidates classified
 *   ... --topic dsh-plugin
 *
 * Two problems have to be solved together, and solving only the first is what
 * every other directory did.
 *
 * 1. Coverage. `awesome-dsh-plugin` is curated, so seeding from it alone caps
 *    us well below the topic. The topic is the wider source.
 *
 * 2. The topic is not a registry. Unrelated projects tag along for the
 *    attention — other harnesses, agent clients, tool switchers — and a
 *    directory that ingests the topic verbatim publishes install commands for
 *    software that cannot be installed. So every candidate is checked against
 *    its own source for a DSH plugin marker, and what fails is counted and
 *    reported rather than quietly dropped.
 *
 * Admitted rows land at visibility "hidden", exactly like the seed: they are
 * browsable and searchable immediately, and no detail page exists until the
 * copy is worth indexing.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";

import { db } from "../db/client";
import { ingestRejections, plugins } from "../db/schema";
import { displayName } from "./lib/registry";
import { commitCount as ghCommitCount, exhausted, gh as ghFetch } from "./lib/github";

/** The shared client, with this script's User-Agent already applied. */
const gh = <T,>(path: string, raw = false) =>
  ghFetch<T>(path, { agent: "dshmarketplace-ingest", raw });

const commitCount = (owner: string, repo: string) =>
  ghCommitCount(owner, repo, "dshmarketplace-ingest");

const TOKEN = process.env.GITHUB_TOKEN;
const API = "https://api.github.com";
const CONCURRENCY = 6;

/** Search caps every query at 1,000 results, however many actually match. */
const PAGE_CAP = 1000;

const TOPICS = ["dsh-plugin", "deepseek-harness"];

/** DSH did not exist before this. Nothing older can be a plugin for it. */
const EPOCH = Date.UTC(2026, 6, 1);

/**
 * The bar for admission, matched to `awesome-dsh-plugin`'s own — the curated
 * list this catalogue was seeded from uses one day of age and ten commits, and
 * says plainly what it filters: repositories created minutes before they were
 * submitted. Adopting the same number means the claim on our side is checkable
 * against theirs rather than invented here.
 *
 * A directory's value is what it leaves out. Every repository carrying the
 * topic is one `dsh plugin add` away from a user's profile whether we list it
 * or not; listing an empty scaffold only makes ours harder to search.
 */
const MIN_COMMITS = 10;

/**
 * Hosts, not plugins.
 *
 * They carry the topic and every marker a plugin does, and one of them is the
 * most-starred repository in the ecosystem by two orders of magnitude — so it
 * sat at the top of the catalogue offering
 * `dsh plugin add github:deepseek-ai/deepseek-harness`. The sandbox even
 * passed it, because installing the harness into a profile does technically
 * work. A directory of plugins for a harness must not list the harness as one
 * of them.
 */
const IS_A_HOST = new Set([
  "deepseek-ai/deepseek-harness",
  "sandbaseai/sandbase-harness",
]);

type SearchRepo = {
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  archived: boolean;
  fork: boolean;
  // The invalidator for `ingest_rejections`: nothing the bar checks can
  // change without a push, and search hands this over for free.
  pushed_at: string;
  topics?: string[];
};

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");

/**
 * Walks a topic past the 1,000-result ceiling by bisecting on creation time
 * until every window fits under it. One dimension is enough and needs no
 * tuning: whatever the star distribution turns out to be, halving an interval
 * always halves what is in it.
 */
async function* discover(topic: string): AsyncGenerator<SearchRepo> {
  const windows: [number, number][] = [[EPOCH, Date.now() + 3_600_000]];
  const seen = new Set<string>();

  while (windows.length) {
    const [lo, hi] = windows.pop()!;
    const range = `created:${iso(lo)}..${iso(hi)}`;
    const query = encodeURIComponent(`topic:${topic} ${range}`);

    const head = await gh<{ total_count: number; items: SearchRepo[] }>(
      `/search/repositories?q=${query}&per_page=100&sort=updated&order=desc`,
    );
    if (!head) continue;

    if (head.total_count > PAGE_CAP && hi - lo > 60_000) {
      const mid = lo + Math.floor((hi - lo) / 2);
      windows.push([lo, mid], [mid + 1000, hi]);
      continue;
    }

    if (head.total_count > PAGE_CAP) {
      console.warn(`  ! ${range} holds ${head.total_count}, past the cap`);
    }

    for (let page = 1; page <= Math.ceil(Math.min(head.total_count, PAGE_CAP) / 100); page++) {
      const body =
        page === 1
          ? head
          : await gh<{ items: SearchRepo[] }>(
              `/search/repositories?q=${query}&per_page=100&page=${page}&sort=updated&order=desc`,
            );

      for (const repo of body?.items ?? []) {
        if (seen.has(repo.full_name)) continue;
        seen.add(repo.full_name);
        yield repo;
      }
    }
  }
}

/**
 * Is this actually a DSH plugin?
 *
 * The markers are the harness's own contract, not our invention: a `dsh` field
 * in `package.json` (the bundle manifest DSH reads), a dependency on the
 * harness or on Cordis underneath it, or the `cordis.patch.yml` row that puts
 * a plugin into a profile. Skill bundles carry none of those, so `SKILL.md` is
 * admitted separately — DSH installs skills too.
 */
async function classify(owner: string, repo: string) {
  const pkgRaw = await gh<string>(
    `/repos/${owner}/${repo}/contents/package.json`,
    true,
  );

  let pkg: Record<string, unknown> | null = null;
  try {
    pkg = pkgRaw ? JSON.parse(pkgRaw) : null;
  } catch {
    pkg = null;
  }

  if (pkg) {
    if (pkg.dsh && typeof pkg.dsh === "object") return { ok: true, why: "dsh manifest" };

    const deps = Object.keys({
      ...((pkg.dependencies ?? {}) as object),
      ...((pkg.peerDependencies ?? {}) as object),
      ...((pkg.devDependencies ?? {}) as object),
    });
    if (deps.some((d) => /^@deepseek-ai\//.test(d))) return { ok: true, why: "dsh dependency" };
    if (deps.some((d) => /^(cordis|@cordisjs\/)/.test(d))) return { ok: true, why: "cordis dependency" };
  }

  const tree = await gh<{ name: string; type: string }[]>(
    `/repos/${owner}/${repo}/contents`,
  );
  const names = new Set((tree ?? []).map((e) => e.name.toLowerCase()));

  if (names.has("cordis.patch.yml") || names.has("cordis.yml")) {
    return { ok: true, why: "cordis patch" };
  }
  if (names.has("skill.md") || names.has("skills")) {
    return { ok: true, why: "skill bundle" };
  }

  return { ok: false, why: pkg ? "no dsh marker" : "no package.json" };
}

/**
 * A navigational guess, never a claim about the plugin. Only assigns when a
 * word actually appears; everything else stays uncategorised rather than being
 * swept into a default bucket that would then be wrong.
 */
const CATEGORY_WORDS: [string, RegExp][] = [
  ["memory", /\b(memory|memories|recall|remember|记忆)\b/i],
  ["vision", /\b(vision|image|ocr|screenshot|multimodal|视觉)\b/i],
  ["theme", /\b(theme|skin|colou?r scheme|主题|皮肤)\b/i],
  ["model", /\b(model|provider|openai|anthropic|gemini|ollama|模型)\b/i],
  ["session", /\b(session|history|transcript|conversation|会话)\b/i],
  ["notify", /\b(notification|notify|webhook|telegram|discord|slack|通知)\b/i],
  ["usage", /\b(usage|billing|cost|token count|quota|用量|计费)\b/i],
  ["skill", /\b(skill|skills|技能)\b/i],
  ["market", /\b(marketplace|registry|directory|store|catalog|插件市场)\b/i],
  ["workflow", /\b(workflow|automation|orchestrat|schedul|pipeline|工作流)\b/i],
  ["ui", /\b(ui|interface|sidebar|panel|web ui|界面)\b/i],
  ["dev", /\b(dev|debug|lint|test|build|runtime|开发)\b/i],
  ["fun", /\b(fun|game|pet|toy|娱乐|游戏)\b/i],
];

function guessCategory(repo: SearchRepo) {
  const hay = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`;
  for (const [id, re] of CATEGORY_WORDS) if (re.test(hay)) return id;
  return null;
}

const slugify = (fullName: string) =>
  fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Turso is a network hop, and a run long enough to walk the whole topic will
 * meet a connect timeout eventually. Losing an hour of crawling to one dropped
 * packet is the wrong failure mode — the run is resumable, but only because it
 * gets to finish.
 */
async function persist(write: () => Promise<unknown>) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write();
    } catch (err) {
      if (attempt >= 4) throw err;
      const wait = 2000 * attempt;
      console.warn(`  write failed (${attempt}/3) — retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(argv[limitArg + 1]) : Infinity;
  const topicArg = argv.indexOf("--topic");
  const topics = topicArg >= 0 ? [argv[topicArg + 1]] : TOPICS;
  const commitsArg = argv.indexOf("--min-commits");
  const minCommits = commitsArg >= 0 ? Number(argv[commitsArg + 1]) : MIN_COMMITS;

  if (!TOKEN) {
    console.warn("no GITHUB_TOKEN — search is capped at 10 requests/minute\n");
  }

  const known = new Set(
    (await db.select({ fullName: plugins.fullName }).from(plugins)).map((r) =>
      r.fullName.split("#")[0].toLowerCase(),
    ),
  );
  console.log(`${known.size} repositories already in the catalogue`);

  // What the bar has already turned away, keyed by the push it was judged at.
  const refused = new Map(
    (await db.select().from(ingestRejections)).map((r) => [
      r.fullName.toLowerCase(),
      r.pushedAt.getTime(),
    ]),
  );
  console.log(`${refused.size} already turned away, and not paid for again\n`);

  const rejects: Record<string, number> = {};
  let skipped = 0;
  const histogram: Record<string, number> = {};
  const bucket = (n: number) =>
    n < 5 ? "  1-4" : n < 10 ? "  5-9" : n < 25 ? " 10-24" : n < 100 ? " 25-99" : "100+";
  let seen = 0;
  let fresh = 0;
  let admitted = 0;

  for (const topic of topics) {
    console.log(`topic:${topic}`);
    const queue: SearchRepo[] = [];

    const drain = async () => {
      const batch = queue.splice(0, CONCURRENCY);
      await Promise.all(
        batch.map(async (repo) => {
          const pushed = new Date(repo.pushed_at);

          /**
           * Records the rejections that cost API calls, so tomorrow is free.
           *
           * The three checks above it are not recorded, because they are free
           * to repeat and a description can be added without a push — writing
           * those down would strand a repository that had just fixed the one
           * thing we asked for.
           */
          const reject = (why: string, paidFor = false) => {
            rejects[why] = (rejects[why] ?? 0) + 1;
            if (paidFor && !dryRun) {
              return persist(() =>
                db
                  .insert(ingestRejections)
                  .values({ fullName: repo.full_name, reason: why, pushedAt: pushed })
                  .onConflictDoUpdate({
                    target: ingestRejections.fullName,
                    set: { reason: why, pushedAt: pushed, checkedAt: new Date() },
                  }),
              );
            }
          };

          // Free signals first — no point spending two API calls on a repo
          // that cannot be listed usefully whatever its manifest says. A
          // listing with no description is a link, and a link is what every
          // other directory already gives you.
          if (repo.archived) return reject("archived");
          if (!repo.description?.trim()) return reject("no description");
          if (IS_A_HOST.has(repo.full_name.toLowerCase())) return reject("a harness, not a plugin");

          // Already judged, and nothing has been pushed since. Neither the
          // manifest nor the commit count can have moved, so re-deciding would
          // spend two requests to reach the same answer.
          const at = refused.get(repo.full_name.toLowerCase());
          if (at !== undefined && pushed.getTime() <= at) {
            skipped++;
            return;
          }

          // Both branches below read a null or a zero as evidence, and once
          // the quota is gone that is exactly what a failed request returns.
          // Judging past this point would write rejections for repositories
          // nobody looked at, and `pushed_at` would then keep them out until
          // their next push — a wrong answer with a long half-life.
          if (exhausted()) return;

          const verdict = await classify(repo.owner.login, repo.name);
          if (exhausted()) return;
          if (!verdict.ok) return reject(verdict.why, true);

          const commits = await commitCount(repo.owner.login, repo.name);
          // Null is "we could not find out", which the shared client keeps
          // distinct from zero on purpose. Recording a rejection on it would
          // hold the repository out until its next push, over a request that
          // simply failed.
          if (exhausted() || commits === null) return;
          histogram[bucket(commits)] = (histogram[bucket(commits)] ?? 0) + 1;
          if (commits < minCommits) return reject(`under ${minCommits} commits`, true);

          admitted++;
          if (dryRun) {
            console.log(`  + ${repo.full_name} (${verdict.why}, ★${repo.stargazers_count})`);
            return;
          }

          const fullName = repo.full_name;
          await persist(() =>
            db
              .insert(plugins)
              .values({
                fullName,
                owner: repo.owner.login,
                repo: repo.name,
                subpath: null,
                slug: slugify(fullName),
                name: displayName(repo.name, null),
                repoUrl: `https://github.com/${fullName}`,
                summary: repo.description,
                categoryId: guessCategory(repo),
                stars: repo.stargazers_count ?? 0,
                isArchived: Boolean(repo.archived),
                provenance: "topic",
                inRegistry: false,
                visibility: "hidden",
                syncedAt: new Date(),
              })
              .onConflictDoNothing({ target: plugins.fullName }),
          );
        }),
      );
    };

    for await (const repo of discover(topic)) {
      if (exhausted()) break;
      seen++;
      if (repo.fork) continue;
      if (known.has(repo.full_name.toLowerCase())) continue;

      known.add(repo.full_name.toLowerCase());
      fresh++;
      queue.push(repo);

      if (queue.length >= CONCURRENCY) await drain();
      if (fresh % 100 === 0) console.log(`  …${fresh} new, ${admitted} admitted`);
      if (fresh >= limit) break;
    }

    while (queue.length) await drain();
    console.log(
      `  ${topic}: ${seen} seen, ${fresh} new, ${admitted} admitted, ` +
        `${skipped} skipped without a request\n`,
    );
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(plugins);

  // The saving is printed rather than assumed. If it ever falls back toward
  // zero the topic has started churning, and the run is about to get expensive
  // again in exactly the way that cancelled the first scheduled one.
  if (exhausted()) {
    console.log(
      "\nstopped early: the API quota ran out. Discovery resumes tomorrow " +
        "where the rejection table leaves off, and every step after this one " +
        "still ran.",
    );
  }
  console.log(`admitted   ${admitted}`);
  console.log(`skipped    ${skipped} judged before, unchanged since`);
  console.log("rejected");
  for (const [why, n] of Object.entries(rejects).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${why}`);
  }
  console.log("\ncommits, among candidates that passed the marker check");
  for (const key of ["  1-4", "  5-9", " 10-24", " 25-99", "100+"]) {
    if (histogram[key]) console.log(`  ${key.padStart(7)}  ${histogram[key]}`);
  }
  console.log(`\ncatalogue now ${total}${dryRun ? " (dry run — nothing written)" : ""}`);
}

main();
