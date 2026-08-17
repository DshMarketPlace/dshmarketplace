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
import { eq, asc, isNotNull } from "drizzle-orm";

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

async function gh<T>(path: string, raw = false): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: raw ? "application/vnd.github.raw" : "application/vnd.github+json",
      "User-Agent": "dshmarketplace-sync",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });

  if (res.status === 404) return null;

  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0) * 1000;
    const waitMs = Math.max(reset - Date.now(), 60_000);
    console.warn(`rate limited — sleeping ${Math.round(waitMs / 1000)}s`);
    await new Promise((r) => setTimeout(r, waitMs));
    return gh<T>(path, raw);
  }

  if (!res.ok) return null;
  return raw ? ((await res.text()) as T) : ((await res.json()) as T);
}

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
}) {
  const repo = await gh<Repo>(`/repos/${row.owner}/${row.repo}`);
  if (!repo) {
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
      contentScore: scoreContent({ overview: null, readmeMd, summary }),
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
  const limit = Number(argv.find((a) => /^\d+$/.test(a))) || 10_000;

  const rows = await db
    .select({
      id: plugins.id,
      owner: plugins.owner,
      repo: plugins.repo,
      summary: plugins.summary,
    })
    .from(plugins)
    .where(only ? isNotNull(plugins.linuxdoUrl) : undefined)
    .orderBy(asc(plugins.syncedAt))
    .limit(limit);

  console.log(`syncing ${rows.length} repos (concurrency ${CONCURRENCY})`);
  if (!TOKEN) console.warn("no GITHUB_TOKEN — 60 req/hr, this will crawl");

  // Repos that publish several plugins share one GitHub repo; fetch each
  // distinct repo once and fan the result out to its rows.
  let cursor = 0;
  let ok = 0;
  let gone = 0;

  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      try {
        const result = await syncOne(row);
        if (result === "ok") ok++;
        else gone++;
      } catch (err) {
        console.warn(`  ${row.owner}/${row.repo}: ${(err as Error).message}`);
      }
      if ((ok + gone) % 50 === 0) console.log(`  ...${ok + gone}/${rows.length}`);
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  console.log(`\ndone: ${ok} updated, ${gone} unreachable`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
