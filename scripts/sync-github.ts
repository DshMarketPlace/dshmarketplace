/**
 * Enriches catalog rows from the GitHub API: stars, language, licence, last
 * push, README, npm package, and the risk flags shown before install.
 *
 * README markdown is rendered and sanitised here rather than at request time —
 * it keeps the parser out of the Worker bundle, and README content is
 * untrusted, so this sanitiser is the only thing between a repo author and
 * stored XSS.
 *
 *   GITHUB_TOKEN=$(gh auth token) pnpm tsx scripts/sync-github.ts [limit]
 */
import "dotenv/config";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { eq, asc, desc, isNull } from "drizzle-orm";

import { gh as ghFetch, exhausted } from "./lib/github";
import { db } from "../db/client";
import { plugins } from "../db/schema";
import { scoreContent } from "../lib/plugin-scoring";

const TOKEN = process.env.GITHUB_TOKEN;
const CONCURRENCY = 8;
const API = "https://api.github.com";

type Repo = {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { spdx_id: string | null } | null;
  archived: boolean;
  pushed_at: string | null;
  created_at: string | null;
  homepage: string | null;
  description: string | null;
};

/** The shared client, with this script's User-Agent already applied. */
const gh = <T,>(path: string, raw = false) =>
  ghFetch<T>(path, { agent: "dshmarketplace-sync", raw });

/**
 * Absolute-URL rewriting matters: READMEs use repo-relative links and images,
 * which resolve against our own domain once the HTML is lifted out of GitHub.
 */
function renderReadme(md: string, owner: string, repo: string) {
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
  const blob = `https://github.com/${owner}/${repo}/blob/HEAD/`;

  const html = marked.parse(md, { async: false }) as string;

  return sanitizeHtml(html, {
    allowedTags: [
      "h3","h4","h5","h6","p","a","ul","ol","li","blockquote",
      "code","pre","em","strong","del","hr","br","img","table","thead",
      "tbody","tr","th","td","details","summary","kbd",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title"],
      code: ["class"],
      th: ["align"],
      td: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      // The page owns h1 and h2. A README heading promoted into that range
      // competes with the page's own outline, so every level drops by two and
      // the deepest ones flatten into h6.
      h1: "h3",
      h2: "h3",
      h3: "h4",
      h4: "h5",
      h5: "h6",
      h6: "h6",
      a: (tag, attribs) => {
        let href = attribs.href ?? "";
        if (href && !/^(https?:|mailto:|#)/i.test(href)) {
          href = blob + href.replace(/^\.?\//, "");
        }
        return {
          tagName: "a",
          attribs: { ...attribs, href, rel: "nofollow noopener", target: "_blank" },
        };
      },
      img: (tag, attribs) => {
        let src = attribs.src ?? "";
        if (src && !/^https?:/i.test(src)) {
          src = base + src.replace(/^\.?\//, "");
        }
        return { tagName: "img", attribs: { ...attribs, src, loading: "lazy" } };
      },
    },
  });
}

/** Is this name actually on the registry, or only claimed in a package.json? */
async function published(name: string) {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${name.replace("/", "%2f")}`,
      { method: "HEAD", headers: { "User-Agent": "dshmarketplace-sync" } },
    );
    return res.ok;
  } catch {
    // A registry hiccup must not silently strip a working command from every
    // listing it touches. Unknown means keep what we had.
    return true;
  }
}

/** Machine-detectable concerns worth surfacing before someone runs `add`. */
function detectRisks(readme: string, pkg: Record<string, unknown> | null) {
  const flags: string[] = [];
  const scripts = (pkg?.scripts ?? {}) as Record<string, string>;

  if (scripts.postinstall || scripts.preinstall || scripts.install) {
    flags.push("install script");
  }
  if (/\b(bash|shell|exec|child_process|spawn)\b/i.test(readme)) {
    flags.push("terminal surface");
  }
  if (/\b(API[_ ]?KEY|TOKEN|SECRET|password)\b/.test(readme)) {
    flags.push("requires credentials");
  }
  return flags;
}

async function syncOne(row: {
  id: number;
  owner: string;
  repo: string;
  summary: string | null;
  overview: string | null;
  overviewZh: string | null;
  docs: string | null;
  illustration: string | null;
}) {
  const repo = await gh<Repo>(`/repos/${row.owner}/${row.repo}`);
  if (!repo) {
    // Null means "gone" *or* "we could not ask", and the two must not share a
    // consequence: archiving on a spent quota would retire every remaining
    // listing in the batch, silently, in a run that reports success.
    if (exhausted()) return "skipped";

    await db
      .update(plugins)
      .set({ isArchived: true, syncedAt: new Date() })
      .where(eq(plugins.id, row.id));
    return "gone";
  }

  const readmeMd =
    (await gh<string>(`/repos/${row.owner}/${row.repo}/readme`, true)) ?? "";

  const pkgRaw = await gh<string>(
    `/repos/${row.owner}/${row.repo}/contents/package.json`,
    true,
  );

  let pkg: Record<string, unknown> | null = null;
  try {
    pkg = pkgRaw ? JSON.parse(pkgRaw) : null;
  } catch {
    pkg = null;
  }

  const declared =
    pkg && typeof pkg.name === "string" && !pkg.private ? pkg.name : null;

  // A `name` in package.json is an intention, not a publication. Taking it as
  // one put 29 install commands into the catalogue for packages that are not
  // on npm — found by installing them, not by reading them. The command a
  // listing publishes has to be one that resolves, so ask the registry.
  const npmPackage = declared && (await published(declared)) ? declared : null;

  const readmeHtml = readmeMd
    ? renderReadme(readmeMd, row.owner, row.repo)
    : null;

  const summary = row.summary ?? repo.description ?? null;

  await db
    .update(plugins)
    .set({
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      openIssues: repo.open_issues_count ?? 0,
      language: repo.language,
      license: repo.license?.spdx_id ?? null,
      isArchived: Boolean(repo.archived),
      repoPushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      repoCreatedAt: repo.created_at ? new Date(repo.created_at) : null,
      homepageUrl: repo.homepage || null,
      summary,
      readmeMd: readmeMd || null,
      readmeHtml,
      npmPackage,
      installKind: npmPackage ? "npm" : "github",
      riskFlags: JSON.stringify(detectRisks(readmeMd, pkg)),
      // Every field the score is made of, or the sync silently unmakes it.
      // This passed `overview: null` and omitted the other three, so a nightly
      // run reset any written page to 20 against a threshold of 70 — no error,
      // no log line, and `promote.ts` filters on exactly this column, so a page
      // synced before it was promoted could never be promoted at all. Yesterday's
      // batch survived only by being written and promoted between two syncs.
      contentScore: scoreContent({
        readmeMd,
        summary,
        overview: row.overview,
        overviewZh: row.overviewZh,
        docs: row.docs,
        illustration: row.illustration,
      }),
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(plugins.id, row.id));

  return "ok";
}

async function main() {
  const argv = process.argv.slice(2);
  const onlyAt = argv.indexOf("--only");
  // A newly added plugin needs its README and package.json before it has a
  // page worth showing; re-crawling a thousand repos to get one is wasteful.
  const only = onlyAt === -1 ? null : argv[onlyAt + 1];
  if (onlyAt !== -1 && (!only || only.startsWith("--"))) {
    throw new Error("--only requires an owner/repo full name");
  }
  const limit = Number(argv.find((a) => /^\d+$/.test(a))) || 10_000;
  // The review needs a README and will not write without one, so a listing
  // that has never had one fetched is worth more than one being refreshed for
  // the fifth time. Oldest-synced order alone starves them indefinitely.
  const missing = argv.includes("--missing-readme");

  const rows = await db
    .select({
      id: plugins.id,
      owner: plugins.owner,
      repo: plugins.repo,
      summary: plugins.summary,
      overview: plugins.overview,
      overviewZh: plugins.overviewZh,
      docs: plugins.docs,
      illustration: plugins.illustration,
    })
    .from(plugins)
    .where(
      only
        ? eq(plugins.fullName, only)
        : missing
          ? isNull(plugins.readmeMd)
          : undefined,
    )
    .orderBy(missing ? desc(plugins.stars) : asc(plugins.syncedAt))
    .limit(limit);

  console.log(`syncing ${rows.length} repos (concurrency ${CONCURRENCY})`);
  if (!TOKEN) console.warn("no GITHUB_TOKEN — 60 req/hr, this will crawl");

  // Repos that publish several plugins share one GitHub repo; fetch each
  // distinct repo once and fan the result out to its rows.
  let cursor = 0;
  let ok = 0;
  let gone = 0;

  async function worker() {
    // Out of quota means every remaining repo would read as "unreachable",
    // and `syncOne` treats that as a listing to retire. Stop instead.
    while (cursor < rows.length && !exhausted()) {
      const row = rows[cursor++];
      try {
        const result = await syncOne(row);
        if (result === "ok") ok++;
        else if (result === "gone") gone++;
      } catch (err) {
        console.warn(`  ${row.owner}/${row.repo}: ${(err as Error).message}`);
      }
      if ((ok + gone) % 50 === 0) console.log(`  ...${ok + gone}/${rows.length}`);
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  if (exhausted()) {
    console.log(`  stopped at ${cursor}/${rows.length}: out of API quota`);
  }
  console.log(`\ndone: ${ok} updated, ${gone} unreachable`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
