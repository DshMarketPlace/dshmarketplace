/**
 * Repairs stored rows in place after a rendering or naming rule changes,
 * without re-hitting the GitHub API for a thousand repositories.
 *
 *   pnpm tsx scripts/repair-content.ts            # only rows with a page
 *   pnpm tsx scripts/repair-content.ts --all      # every row
 *
 * Three fixes:
 *
 * 1. Display names. A monorepo entry like `strukto-ai/mirage#dsh` was titled
 *    "dsh" — useless as an H1 and as a page title.
 * 2. README heading levels. Imported READMEs kept their own h1 and h2, which
 *    competed with the page's own outline.
 * 3. `contentScore`, recomputed from the row itself. `sync-github.ts` scored
 *    with `overview: null` hardcoded, so every nightly run knocked written
 *    pages down to 20 against a threshold of 70.
 */
import "dotenv/config";
import { eq, ne, or, isNotNull } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { scoreContent } from "../lib/plugin-scoring";
import { displayName } from "./lib/registry";

/** Kept identical to scripts/sync-github.ts — see the note there. */
function renderReadme(md: string, owner: string, repo: string) {
  const base = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
  const blob = `https://github.com/${owner}/${repo}/blob/HEAD/`;

  const html = marked.parse(md, { async: false }) as string;

  return sanitizeHtml(html, {
    allowedTags: [
      "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li", "blockquote",
      "code", "pre", "em", "strong", "del", "hr", "br", "img", "table",
      "thead", "tbody", "tr", "th", "td", "details", "summary", "kbd",
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
      h1: "h3",
      h2: "h3",
      h3: "h4",
      h4: "h5",
      h5: "h6",
      h6: "h6",
      a: (_t, attribs) => {
        let href = attribs.href ?? "";
        if (href && !/^(https?:|mailto:|#)/i.test(href)) {
          href = blob + href.replace(/^\.?\//, "");
        }
        return {
          tagName: "a",
          attribs: {
            ...attribs,
            href,
            rel: "nofollow noopener",
            target: "_blank",
          },
        };
      },
      img: (_t, attribs) => {
        let src = attribs.src ?? "";
        if (src && !/^https?:/i.test(src)) {
          src = base + src.replace(/^\.?\//, "");
        }
        return { tagName: "img", attribs: { ...attribs, src, loading: "lazy" } };
      },
    },
  });
}

async function main() {
  const all = process.argv.includes("--all");

  const rows = await db
    .select({
      id: plugins.id,
      fullName: plugins.fullName,
      name: plugins.name,
      owner: plugins.owner,
      repo: plugins.repo,
      subpath: plugins.subpath,
      readmeMd: plugins.readmeMd,
      readmeHtml: plugins.readmeHtml,
      summary: plugins.summary,
      overview: plugins.overview,
      overviewZh: plugins.overviewZh,
      docs: plugins.docs,
      illustration: plugins.illustration,
      contentScore: plugins.contentScore,
    })
    .from(plugins)
    .where(
      all
        ? or(isNotNull(plugins.subpath), isNotNull(plugins.readmeMd))
        : ne(plugins.visibility, "hidden"),
    );

  console.log(`checking ${rows.length} row(s)`);

  let renamed = 0;
  let rerendered = 0;
  let rescored = 0;

  for (const r of rows) {
    const patch: Record<string, unknown> = {};

    const want = displayName(r.repo, r.subpath);
    if (want !== r.name) {
      patch.name = want;
      renamed++;
      console.log(`  rename ${r.fullName}: "${r.name}" → "${want}"`);
    }

    if (r.readmeMd) {
      const html = renderReadme(r.readmeMd, r.owner, r.repo);
      if (html !== r.readmeHtml) {
        patch.readmeHtml = html;
        rerendered++;
      }
    }

    const score = scoreContent(r);
    if (score !== r.contentScore) {
      patch.contentScore = score;
      rescored++;
      console.log(`  rescore ${r.fullName}: ${r.contentScore} → ${score}`);
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = new Date();
      await db.update(plugins).set(patch).where(eq(plugins.id, r.id));
    }
  }

  console.log(
    `\n${renamed} renamed, ${rerendered} README(s) re-rendered, ${rescored} rescored`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
