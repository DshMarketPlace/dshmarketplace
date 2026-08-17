/**
 * Writes the editorial layer that a scraped card cannot have: a bilingual
 * overview per plugin, plus a commissioned illustration.
 *
 * Depth is the whole differentiator for this catalogue — every competing DSH
 * directory is a wall of cards linking straight out to GitHub. This is the
 * script that makes a detail page worth landing on, and it is what lifts
 * `contentScore` past the promotion threshold.
 *
 *   pnpm tsx scripts/write-content.ts --limit 10
 *   pnpm tsx scripts/write-content.ts --slug some-plugin-slug --images
 *   pnpm tsx scripts/write-content.ts --limit 5 --images --promote
 *
 * Runs against the VeloKey gateway, so it does not consume the coding
 * assistant's budget. Set VELOKEY_API_KEY in .dev.vars.
 */
import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { db } from "../db/client";
import { plugins } from "../db/schema";
import { scoreContent } from "../lib/plugin-scoring";
import { chatBlocks, generateImageSync } from "./lib/velokey";

const run = promisify(execFile);

const IMAGE_DIR = path.join(process.cwd(), "public", "plugins");
const README_BUDGET = 7000;

type Section = { overview: string; docs: string };

type Written = {
  en: Section;
  zh: Section;
  illustrationSubject: string;
  illustrationAlt: string;
};

/**
 * One art direction for the whole set, so twenty illustrations read as a
 * commissioned series rather than twenty stock images. The palette is the
 * site's own — cream paper, copper ink, no pure black.
 *
 * The exclusions are load-bearing: generated lettering is always wrong, and
 * this is a third-party directory, so no product marks may appear.
 */
function illustrationPrompt(subject: string) {
  return [
    "Isometric technical illustration on warm cream paper, colour #F7F1E6.",
    "Fine line-art drafting style, copper-orange ink #C0561D, subtle paper grain,",
    "muted earth tones only, no pure black and no pure white.",
    `Subject: ${subject}.`,
    "Blueprint schematic feel: geometric primitives, dotted construction lines,",
    "measured spacing, centered composition with generous negative space.",
    "Absolutely no text, no letters, no numbers, no logos, no brand marks,",
    "no user interface screenshots, no human figures.",
  ].join(" ");
}

const SYSTEM = `You write reference documentation for a directory of DeepSeek Harness (DSH) plugins.

DeepSeek Harness is DeepSeek's open-source agent harness, built on the Cordis plugin kernel. The model does the reasoning; the harness supplies tools, sessions, sandboxes and a UI. Every capability is a plugin, installed with \`dsh plugin add\`.

Your readers are developers deciding whether to install something that will run inside their agent with their agent's permissions. They want to know what it does, how it works, and what it touches — in that order.

Ground everything in the README you are given. If the README does not establish a fact, do not state it. No invented benchmarks, no invented integrations, no invented limitations. It is correct and expected to write a shorter overview when the source is thin.

Never write marketing prose. Ban list: seamless, powerful, revolutionary, game-changing, robust, cutting-edge, effortlessly, unlock, supercharge, take it to the next level. No exclamation marks. No second-person sales pitch.`;

function userPrompt(p: {
  fullName: string;
  name: string;
  summary: string | null;
  summaryZh: string | null;
  language: string | null;
  license: string | null;
  stars: number;
  categoryId: string | null;
  riskFlags: string[];
  installCmd: string;
  readme: string;
}) {
  return `Write the overview section for this plugin's detail page.

REPOSITORY: ${p.fullName}
PLUGIN NAME: ${p.name}
UPSTREAM SUMMARY (EN): ${p.summary ?? "(none)"}
UPSTREAM SUMMARY (ZH): ${p.summaryZh ?? "(none)"}
PRIMARY LANGUAGE: ${p.language ?? "unknown"}
LICENCE: ${p.license ?? "none detected"}
STARS: ${p.stars}
CATEGORY: ${p.categoryId ?? "uncategorised"}
DETECTED RISK FLAGS: ${p.riskFlags.length ? p.riskFlags.join(", ") : "none"}
INSTALL COMMAND: ${p.installCmd}

README (truncated):
"""
${p.readme.slice(0, README_BUDGET)}
"""

Return the six blocks below, in this exact order, each introduced by its own
marker line and nothing else. No JSON, no code fences, no commentary. Markdown
inside a block is expected; the markers are what separate them.

<<<EN_OVERVIEW>>>
<<<EN_DOCS>>>
<<<ZH_OVERVIEW>>>
<<<ZH_DOCS>>>
<<<ILLUSTRATION_SUBJECT>>>
<<<ILLUSTRATION_ALT>>>

Specifications follow.

"EN_OVERVIEW" — Markdown, 180-260 words, British spelling.
  · First sentence must stand alone and name the plugin: "${p.name} is a DeepSeek Harness plugin that …". It will be quoted out of context by search engines, so it must make sense with nothing before it.
  · Then: how it actually works — the mechanism, the hook it uses, the data it reads or writes. Be concrete. Name the commands, config keys or files the README names.
  · Then: who it is for and when it is the wrong choice. A real limitation, a dependency, a platform constraint, or the fact that it duplicates something the harness already does.
  · If risk flags are listed above, say plainly what the plugin reaches and why.
  · Two or three short paragraphs. At most one short bullet list, only if the README genuinely enumerates something.
  · Use the phrase "DeepSeek Harness plugin" once, naturally, and the plugin's name two or three times. Never repeat a phrase to hit a count.
  · Do not include a heading, the install command, or a licence line — the page already renders those.

"EN_DOCS" — Markdown, 250-400 words. The reference section, rewritten from the README rather than copied out of it.
  · Structure it with \`###\` headings. Choose them from what the README actually documents — typical set: Configuration, Commands, Requirements, How it behaves, Known limits. Three to five of them.
  · Put concrete detail under each: config keys and their defaults, command names and what they take, environment variables, file paths, supported platforms, version requirements. Use a Markdown table when the README lists key/value pairs, and \`inline code\` for every identifier.
  · Omit everything that is repository furniture rather than documentation: badges, star counts, language-switcher links, community and social links, sponsor blocks, contribution guides, changelogs, licence text, and the project's own logo.
  · Lead with what the README does document. Never guess a config key, a default value or a flag — but spend at most one sentence, once, in the whole section on what the source omits. A reader wants the facts that exist, not an inventory of the ones that do not.
  · If the README genuinely documents almost nothing, write one short honest section and stop.
  · Do not restate the overview, and do not include an install command; the page renders those above this section.

"ZH_OVERVIEW" — Markdown, 300-450 Chinese characters. Simplified Chinese.
  · Written, not translated. Do not mirror the English sentence by sentence; a Chinese developer should not be able to tell which was written first.
  · Keep these in English: DeepSeek Harness, DSH, plugin names, npm, GitHub, topic, Star, tarball, commit, agent, token, API, and any command, file name or config key.
  · Use 插件 for plugin, 开源协议 for licence, 源码仓库 for source repository, 会话 for session, 记忆 for memory, 终端 for terminal.
  · Include "DeepSeek Harness 插件" once, naturally.
  · Plain developer register — the way a good Chinese README reads. No 「让您」「轻松」「强大」「赋能」「一站式」. No emoji.
  · Same three beats as the English: what it does, how it works, when not to use it.

"ZH_DOCS" — Markdown, 350-500 Chinese characters, same structure and same exclusions as EN_DOCS.
  · Headings are Chinese（配置、命令、环境要求、行为说明、已知限制），but every key, command, path, flag and value stays verbatim in its original form. Never translate an identifier.
  · Written, not translated from EN_DOCS.

"ILLUSTRATION_SUBJECT" — one English sentence describing an abstract technical diagram of this plugin's mechanism, for an illustrator. Describe shapes and flow, not the product: "a lattice of stacked cubes feeding a lens that focuses into a single solid block" rather than "a memory plugin". No text, no UI, no logos.

"ILLUSTRATION_ALT" — one English sentence of alt text for that illustration, under 125 characters.`;

}

function render(md: string) {
  const html = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: [
      "h3", "h4", "p", "a", "ul", "ol", "li", "blockquote",
      "code", "pre", "em", "strong", "br", "table", "thead",
      "tbody", "tr", "th", "td",
    ],
    allowedAttributes: { a: ["href", "title"], code: ["class"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_t, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "nofollow noopener", target: "_blank" },
      }),
    },
  });
}

/**
 * The gateway returns a ~2 MB PNG. Everything in `public/` ships inside the
 * Worker's asset bundle, so it is resampled and re-encoded before it lands in
 * the repository.
 *
 * q=45 at 1000px rather than something conservative: these are flat line
 * drawings on a single cream ground, so they hold up where a photograph would
 * fall apart — 126 KB against 383 KB at q=72/1200px, visually identical.
 */
const JPEG_QUALITY = "45";
const JPEG_WIDTH = "1000";

async function saveIllustration(png_: Buffer, slug: string) {
  await mkdir(IMAGE_DIR, { recursive: true });

  const png = path.join(IMAGE_DIR, `${slug}.png`);
  const jpg = path.join(IMAGE_DIR, `${slug}.jpg`);
  await writeFile(png, png_);

  await run("sips", [
    "-s", "format", "jpeg",
    "-s", "formatOptions", JPEG_QUALITY,
    "--resampleWidth", JPEG_WIDTH,
    png, "--out", jpg,
  ]);
  await run("rm", [png]);

  return `/plugins/${slug}.jpg`;
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (name: string) => argv.includes(`--${name}`);
  const value = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };

  const limit = Number(value("limit") ?? 10);
  const only = value("slug");
  const withImages = flag("images");
  const dryRun = flag("dry-run");
  const promote = flag("promote");

  const candidates = await db
    .select()
    .from(plugins)
    .where(
      only
        ? eq(plugins.slug, only)
        : and(
            eq(plugins.isArchived, false),
            isNull(plugins.docs),
            ne(plugins.readmeMd, ""),
            sql`length(${plugins.readmeMd}) >= 600`,
          ),
    )
    .orderBy(desc(plugins.inRegistry), desc(plugins.stars))
    .limit(only ? 1 : limit);

  console.log(`${candidates.length} plugin(s) to write\n`);

  let done = 0;
  for (const p of candidates) {
    const flags: string[] = p.riskFlags ? JSON.parse(p.riskFlags) : [];
    const installCmd = p.npmPackage
      ? `dsh plugin add ${p.npmPackage}`
      : `dsh plugin add github:${p.owner}/${p.repo}${p.subpath ? `#${p.subpath}` : ""}`;

    process.stdout.write(`→ ${p.fullName} … `);

    try {
      const b = await chatBlocks(
        userPrompt({
          fullName: p.fullName,
          name: p.name,
          summary: p.summary,
          summaryZh: p.summaryZh,
          language: p.language,
          license: p.license,
          stars: p.stars,
          categoryId: p.categoryId,
          riskFlags: flags,
          installCmd,
          readme: p.readmeMd ?? "",
        }),
        [
          "EN_OVERVIEW", "EN_DOCS", "ZH_OVERVIEW", "ZH_DOCS",
          "ILLUSTRATION_SUBJECT", "ILLUSTRATION_ALT",
        ] as const,
        { system: SYSTEM },
      );
      const out: Written = {
        en: { overview: b.EN_OVERVIEW, docs: b.EN_DOCS },
        zh: { overview: b.ZH_OVERVIEW, docs: b.ZH_DOCS },
        illustrationSubject: b.ILLUSTRATION_SUBJECT,
        illustrationAlt: b.ILLUSTRATION_ALT,
      };
      if (!out.en.overview?.trim() || !out.zh.overview?.trim()) {
        throw new Error("missing copy");
      }

      const zhAll = `${out.zh.overview}\n${out.zh.docs ?? ""}`;
      const enAll = `${out.en.overview}\n${out.en.docs ?? ""}`;
      const cjk = (zhAll.match(/[一-鿿]/g) ?? []).length;
      const words = (enAll.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;

      let illustration: string | null = p.illustration;
      if (withImages && !illustration) {
        const art = await generateImageSync(
          illustrationPrompt(out.illustrationSubject),
          { size: "1024x1024" },
        );
        illustration = await saveIllustration(art, p.slug);
      }

      if (dryRun) {
        console.log(
          `\n${words}w EN / ${cjk} CJK\n` +
            `--- EN overview ---\n${out.en.overview}\n` +
            `--- EN docs ---\n${out.en.docs}\n` +
            `--- ZH overview ---\n${out.zh.overview}\n` +
            `--- ZH docs ---\n${out.zh.docs}\n`,
        );
        done++;
        continue;
      }

      // Plugins found through LINUX DO have no registry description, so their
      // cards fell back to "no description yet" in Chinese and to GitHub's
      // English one-liner on the Chinese page. The overview's opening sentence
      // is written from the README and already says what the plugin does, so
      // it fills the gap without inventing anything.
      const firstSentence = (md: string) =>
        md
          .replace(/^#+ .*$/gm, "")
          .replace(/[*`_>]/g, "")
          .trim()
          .split(/(?<=[.。!?！？])\s+/)[0]
          ?.trim()
          .slice(0, 300) || null;

      const summary = p.summary || firstSentence(out.en.overview);
      const summaryZh = p.summaryZh || firstSentence(out.zh.overview);

      const contentScore = scoreContent({
        overview: out.en.overview,
        overviewZh: out.zh.overview,
        docs: out.en.docs,
        readmeMd: p.readmeMd,
        summary,
        illustration,
      });

      await db
        .update(plugins)
        .set({
          summary,
          summaryZh,
          overview: out.en.overview,
          overviewZh: out.zh.overview,
          overviewHtml: render(out.en.overview),
          overviewHtmlZh: render(out.zh.overview),
          docs: out.en.docs ?? null,
          docsZh: out.zh.docs ?? null,
          docsHtml: out.en.docs ? render(out.en.docs) : null,
          docsHtmlZh: out.zh.docs ? render(out.zh.docs) : null,
          illustration,
          illustrationAlt: out.illustrationAlt?.slice(0, 200) ?? null,
          ogImage: illustration ?? p.ogImage,
          contentScore,
          // Never demote. Re-running the writer on an already-indexed page
          // used to knock it back to `listed`, silently pulling it out of the
          // sitemap as a side effect of improving its copy.
          visibility:
            promote || p.visibility === "indexed" ? "indexed" : "listed",
          indexedAt:
            p.visibility === "indexed"
              ? (p.indexedAt ?? new Date())
              : promote
                ? new Date()
                : p.indexedAt,
          updatedAt: new Date(),
        })
        .where(eq(plugins.id, p.id));

      console.log(
        `${words}w EN / ${cjk} CJK / score ${contentScore}${illustration ? " / illustrated" : ""}`,
      );
      done++;
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message.slice(0, 160)}`);
    }
  }

  console.log(`\nwrote ${done}/${candidates.length}`);
}

main();
