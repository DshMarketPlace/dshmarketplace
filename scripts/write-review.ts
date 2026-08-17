/**
 * Writes the bilingual "AI 锐评" — a blunt read on whether a plugin is worth
 * your time, grounded in what we actually observed.
 *
 *   pnpm tsx scripts/write-review.ts --limit 20
 *   pnpm tsx scripts/write-review.ts --full-name liustack/modlens
 *   pnpm tsx scripts/write-review.ts --limit 5 --dry-run
 *
 * Set REVIEW_API_KEY and REVIEW_API_BASE in `.dev.vars`.
 *
 * The generated text alone is a commodity — any directory can point a model at
 * a README. What makes this one ours is the last fact in the prompt: the
 * sandbox verdict, which is the record of installing the plugin on a machine
 * that had never seen it. "It does not finish installing, and here is the
 * package that blocks it" is not something a scraper can write.
 *
 * Three rules the first trial run broke, and why each is now explicit:
 *
 *   1. It invented a capability that was in no fact given to it.
 *   2. It quoted our internal field names at the reader — `riskFlags` values
 *      and `dsh.profile.bundles` are our vocabulary, not theirs.
 *   3. It attacked a plugin for carrying a "terminal surface" flag. That flag
 *      is our own keyword match against the README, not a defect, and using it
 *      as a stick to beat an author with is both unfair and indefensible if
 *      they turn up to argue. Reviews judge fit and trade-offs, never people.
 */
import "dotenv/config";
import { and, desc, eq, isNotNull, isNull, or, lt, sql } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { db } from "../db/client";
import { plugins, type Plugin } from "../db/schema";
import { primaryInstall } from "../lib/install";
import { chatBlocks } from "./lib/velokey";

const README_BUDGET = 6000;

function endpoint() {
  const apiKey = process.env.REVIEW_API_KEY;
  const base = process.env.REVIEW_API_BASE;
  if (!apiKey || !base) {
    throw new Error("REVIEW_API_KEY and REVIEW_API_BASE must be set in .dev.vars");
  }
  return { apiKey, base: base.replace(/\/$/, "") };
}

/** Our risk flags in the reader's words, so the model never quotes the raw id. */
const RISK_PROSE: Record<string, string> = {
  "install script": "包在安装时会自动跑脚本（这是对 package.json 的静态检查，不代表脚本有问题）",
  "terminal surface": "README 里提到会执行 shell 命令（这是对 README 的关键词匹配，只是提示它能碰到终端）",
  "requires credentials": "需要你提供 API key 或 token 才能用",
};

/** The sandbox verdict in the reader's words. Absent means we have not run it. */
function installProse(p: Plugin) {
  if (!p.installStatus) return "还没有实测过（没有这项证据，不要提安装是否成功）";

  const blocked = p.blockedBuilds ? (JSON.parse(p.blockedBuilds) as string[]) : [];
  const named = blocked.length ? `，被拦的是 ${blocked.join("、")}` : "";

  switch (p.installStatus) {
    case "passed":
      return "实测通过：在全新 profile 里装上，并被 harness 注册进 profile";
    case "needs-approval":
      return `实测：能装进去，但有构建脚本被 pnpm 拦下${named}，导致 harness 没有完成注册。用户需要手动允许该构建才能真正装好`;
    case "failed":
      return `实测失败：装完之后 harness 没有把它注册进 profile${named}`;
    case "timeout":
      return "实测超时：安装在 3 分钟内没有结束";
    default:
      return "实测结果不确定";
  }
}

function facts(p: Plugin) {
  const risks = p.riskFlags ? (JSON.parse(p.riskFlags) as string[]) : [];
  const pushed = p.repoPushedAt?.toISOString().slice(0, 10) ?? "未知";

  return [
    `名称：${p.name}`,
    `仓库：${p.fullName}`,
    `仓库自述：${p.summary ?? "（没有写描述）"}`,
    `Star：${p.stars}｜主要语言：${p.language ?? "未知"}｜开源协议：${p.license ?? "没有声明"}｜最近推送：${pushed}`,
    `安装：${primaryInstall(p)?.cmd ?? "没有一行命令能装（子目录插件或者哪儿都没发布）"}`,
    `已知需要注意的：${risks.length ? risks.map((r) => RISK_PROSE[r] ?? r).join("；") : "静态检查没发现"}`,
    `沙箱实测：${installProse(p)}`,
    `README（可能截断）：\n${(p.readmeMd ?? "（这个仓库没有 README）").slice(0, README_BUDGET)}`,
  ].join("\n");
}

const RULES = `写作规矩，违反任何一条这条锐评就不能用：

1. 只用下面给出的事实。事实里没有的，一个字都不许推断——功能、数字、命令、适用场景都不行。不确定就直说不确定。
2. 评插件，不评人。不许对作者的水平、动机、态度作任何评价，不许暗示项目"糊弄""凑数"。
3. "需要注意的"里那些标记是我们自己做的静态检查，不是插件的缺陷。可以转述成读者能懂的话，但不许拿它当把柄贬低这个插件，也不许把我们的内部字段名（riskFlags、dsh.profile.bundles、installStatus 之类）写进正文。
4. 不吹。禁止"强大""轻松""一站式""赋能""让您"，禁止 emoji，禁止排比煽情。
5. 具体压过形容词。能说"依赖 node-pty，构建脚本被拦时装不完"就别说"安装有点麻烦"。
6. 产品和技术名词保留英文：DeepSeek Harness、DSH、profile、plugin、npm、topic、agent、token。`;

const SHAPE = `每种语言输出四段，用给定的标记包起来，标记独占一行：

<<<ZH_WHAT>>>     一句话说清它是什么、解决什么。不超过 60 字。
<<<ZH_WHO>>>      谁值得装、谁可以跳过。两三句。
<<<ZH_CAVEAT>>>   真实的代价或坑，包括实测结果。确实没有就写「没发现明显的坑」。两三句。
<<<ZH_TAKE>>>     一句不客气的实话，帮读者做决定。可以直接，但对事不对人。一句。
<<<EN_WHAT>>>     同上，英文，独立写而不是翻译。
<<<EN_WHO>>>
<<<EN_CAVEAT>>>
<<<EN_TAKE>>>`;

const KEYS = [
  "ZH_WHAT", "ZH_WHO", "ZH_CAVEAT", "ZH_TAKE",
  "EN_WHAT", "EN_WHO", "EN_CAVEAT", "EN_TAKE",
] as const;

function render(parts: Record<string, string>, locale: "zh" | "en") {
  const L = locale === "zh"
    ? { what: "是什么", who: "谁该装", caveat: "注意", take: "锐评" }
    : { what: "What it is", who: "Who it is for", caveat: "Watch out", take: "The verdict" };
  const p = locale === "zh" ? "ZH" : "EN";

  return [
    `**${L.what}** — ${parts[`${p}_WHAT`]}`,
    `**${L.who}** — ${parts[`${p}_WHO`]}`,
    `**${L.caveat}** — ${parts[`${p}_CAVEAT`]}`,
    `**${L.take}** — ${parts[`${p}_TAKE`]}`,
  ].join("\n\n");
}

function toHtml(md: string) {
  return sanitizeHtml(marked.parse(md, { async: false }) as string, {
    allowedTags: ["p", "strong", "em", "code", "br"],
    allowedAttributes: {},
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const at = (flag: string) => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };
  const limit = Number(at("--limit")) || 10;
  const one = at("--full-name");
  const model = process.env.REVIEW_MODEL ?? "grok-4.6";

  // Reviews are worth regenerating once a plugin has been through the sandbox,
  // because that is the fact that makes them ours. Everything else is stable.
  const stale = and(
    isNotNull(plugins.installCheckedAt),
    or(isNull(plugins.reviewedAt), lt(plugins.reviewedAt, plugins.installCheckedAt)),
  );

  const rows = await db
    .select()
    .from(plugins)
    .where(
      one
        ? eq(plugins.fullName, one)
        : and(eq(plugins.isArchived, false), isNotNull(plugins.readmeMd), stale),
    )
    .orderBy(desc(plugins.stars))
    .limit(one ? 1 : limit);

  console.log(`${rows.length} to review, model ${model}\n`);

  for (const row of rows) {
    process.stdout.write(`→ ${row.fullName} … `);
    try {
      const parts = await chatBlocks(
        `你在给一个 DeepSeek Harness 插件目录站写「AI 锐评」。这段话会标明是 AI 生成、仅供参考，读者最终以实际运行为准——所以它必须准确，不能靠含糊取巧。\n\n${RULES}\n\n${SHAPE}\n\n事实：\n${facts(row)}`,
        KEYS,
        { model, endpoint: endpoint(), maxTokens: 3000 },
      );

      const zh = render(parts, "zh");
      const en = render(parts, "en");

      if (dryRun) {
        console.log(`\n--- zh\n${zh}\n--- en\n${en}\n`);
        continue;
      }

      await db
        .update(plugins)
        .set({
          review: en,
          reviewZh: zh,
          reviewHtml: toHtml(en),
          reviewHtmlZh: toHtml(zh),
          reviewModel: model,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(plugins.id, row.id));

      console.log("ok");
    } catch (err) {
      console.log(`failed: ${(err as Error).message.slice(0, 120)}`);
    }
  }
}

main();
