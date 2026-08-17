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
import { persist } from "./lib/persist";
import { joinIdentifiers } from "./lib/text";

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
  "install script": "安装时会自动执行脚本",
  "terminal surface": "会执行 shell 命令",
  "requires credentials": "需要提供 API key 或 token",
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
    case "not-a-layer":
      return "实测：装是装上了，但它的 package.json 里没有 dsh.bundle，所以 harness 把它当普通依赖收下，没有变成 profile layer。这不是安装失败，是它本来就不是 bundle 型插件";
    case "failed": {
      // The stored detail names the cause when the probe recognised one — a
      // BOM in package.json, say — and a named cause is worth far more than
      // the catch-all, which only restates the verdict. Used only when it is
      // not that catch-all, so the common case keeps its written sentence.
      const generic = "installed but not registered as a profile bundle";
      return p.installDetail && p.installDetail !== generic
        ? `实测失败，具体原因：${p.installDetail}${named}`
        : `实测失败：装完之后 harness 没有把它注册进 profile${named}`;
    }
    case "timeout":
      return "实测超时：安装在 3 分钟内没有结束";
    default:
      return "实测结果不确定";
  }
}

/**
 * A constraint the model is not allowed to reason its way out of.
 *
 * Left to prose rules it wrote "I would install it" under a verdict section
 * whose own caveat said the plugin does not finish installing. Whether to
 * recommend something we watched fail is not a judgement call, so it is not
 * left as one.
 */
function verdictConstraint(p: Plugin) {
  switch (p.installStatus) {
    case "failed":
    case "timeout":
      return "\n\n硬约束：实测显示它现在装不上。第四段必须反映这一点，绝对不能建议读者直接安装；可以说清在什么条件下才值得回头再看。";
    case "needs-approval":
      return "\n\n硬约束：实测显示它要先手动允许构建才能装好。第四段如果建议安装，必须同时点明这一步，不能让读者以为一行命令就完事。";
    case "not-a-layer":
      return "\n\n硬约束：实测显示这条命令能装上，不许说它装不上。但它进的是普通依赖，不是 profile layer——第四段如果建议安装，要让读者知道装完不会多出一个 profile layer，得按它 README 说的方式用。";
    default:
      return "";
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
    `安装方式：${primaryInstall(p) ? (p.npmPackage ? "npm 一行装" : "从 GitHub 源码装") : "没有一行命令能装（子目录插件，或者哪儿都没发布）"}`,
    `静态检查发现（这是我们扫 README 和 package.json 得到的，只是提示，不是缺陷）：${risks.length ? risks.map((r) => RISK_PROSE[r] ?? r).join("；") : "没有发现"}`,
    `沙箱实测：${installProse(p)}`,
    `README（可能截断）：\n${(p.readmeMd ?? "（这个仓库没有 README）").slice(0, README_BUDGET)}`,
  ].join("\n");
}

const RULES = `写作规矩，违反任何一条这条锐评就不能用：

1. 只用下面给出的事实。事实里没有的，一个字都不许推断——功能、数字、命令、适用场景都不行。不确定就直说不确定。
2. 评插件，不评人。不许对作者的水平、动机、态度作任何评价，不许暗示项目"糊弄""凑数"。
3. 静态检查那几条是我们扫 README 和 package.json 扫出来的提示，不是缺陷。可以转述成人话，但不许拿它贬低插件，也不许把内部字段名（riskFlags、dsh.profile.bundles、installStatus 之类）写进正文。
4. 不吹。禁止"强大""轻松""一站式""赋能""让您"，禁止 emoji，禁止排比煽情。
5. 具体压过形容词。能说"依赖 node-pty，构建脚本被拦时装不完"就别说"安装有点麻烦"。
6. 产品和技术名词保留英文：DeepSeek Harness、DSH、profile、plugin、npm、topic、agent、token。

再加三条，上一版就是栽在这里：

7. 禁止同义反复。"需要侧边栏的人适合装侧边栏插件""想要 X 的用户可以装 X"这种句子等于没说，一句都不许出现。谁该装必须落到**具体处境**——用什么模型、做什么活、缺哪块能力。
8. 四段之间不许互相复述。同一件事在前面说过，后面就不能再说一遍，换个措辞也不行。
9. 不要重复页面上已经有的东西：安装命令、Star 数、协议、语言，这些就在锐评旁边摆着，写进来是浪费读者的眼睛。
10. 四段不许自相矛盾。第二段说了某类人适合装，第四段就不能整体否定这个插件；要否定，只能否定"在某个前提下"，并且把那个前提说出来。
11. 不许用没有依据的比较来否定它。"别的方案更好""这类模型自己就能做"——事实里没给的，就是编的。要说不值得装，理由必须来自上面列出的事实。
12. 中文和英文、数字之间留一个半角空格：写"使用 DeepSeek Harness 进行"，不要写"使用DeepSeek Harness进行"。
13. 不许把安装规格串写进正文。"需手动允许 github:owner/repo 的构建"要写成"从源码装时需要先手动放行它的构建脚本"——读者要的是那件事，不是那串字符。`;

const SHAPE = `每种语言输出四段，用给定的标记包起来，标记独占一行：

<<<ZH_WHAT>>>     一句话说清它做什么。不超过 60 字。不要抄仓库自述的措辞。
<<<ZH_WHO>>>      第一句写一个能对号入座的具体场景（在做什么活、用什么模型、缺哪块能力）。第二句写谁不必装，理由必须是**另一个角度**，不能是第一句的否定式——"不做 X 的人不用装"等于没说。
<<<ZH_CAVEAT>>>   真实的代价。实测结果优先写在这里。确实没有就写「没发现明显的坑」，不要硬凑。两三句。
<<<ZH_TAKE>>>     只回答一个问题：换成你，装还是不装，为什么。一句话。这句必须提供**前三段没给过的判断**——一个取舍、一个前提、或者一句直白的值不值。禁止复述前面。
<<<EN_WHAT>>>     同上，英文，独立写而不是翻译。
<<<EN_WHO>>>
<<<EN_CAVEAT>>>
<<<EN_TAKE>>>

第四段不要每次都用同一个句式。"如果…我会装它，因为…" 连着用两次就说明你在套模板，换一种说法。

写完自检一遍：第四段如果去掉，读者会不会少知道一件事？如果不会，重写它。`;

const KEYS = [
  "ZH_WHAT", "ZH_WHO", "ZH_CAVEAT", "ZH_TAKE",
  "EN_WHAT", "EN_WHO", "EN_CAVEAT", "EN_TAKE",
] as const;

function render(parts: Record<string, string>, locale: "zh" | "en") {
  const L = locale === "zh"
    ? { what: "是什么", who: "谁该装", caveat: "注意", take: "锐评" }
    : { what: "What it is", who: "Who it is for", caveat: "Watch out", take: "The verdict" };
  const p = locale === "zh" ? "ZH" : "EN";

  return joinIdentifiers(
    [
      `**${L.what}** — ${parts[`${p}_WHAT`]}`,
      `**${L.who}** — ${parts[`${p}_WHO`]}`,
      `**${L.caveat}** — ${parts[`${p}_CAVEAT`]}`,
      `**${L.take}** — ${parts[`${p}_TAKE`]}`,
    ].join("\n\n"),
    locale,
  );
}

/** A section that admits it has no content is worse than an absent review. */
const NON_ANSWER = [
  /未提供/,
  /未说明/,
  /未提及/,
  /没有提供/,
  /信息不足/,
  /not (?:provided|specified|stated)/i,
  /no (?:specific )?(?:use case|information|details) (?:provided|given|available)/i,
];

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
  // The prompt is the product here, and it changes. Without this, tightening
  // it leaves every already-written review frozen at the old wording.
  const force = argv.includes("--force");
  const model = process.env.REVIEW_MODEL ?? "grok-4.6";

  // Write once, then rewrite when the sandbox has something to add.
  //
  // Requiring a verdict up front looked right — it is the fact that makes a
  // review ours — but it permanently excluded the listings at the top of the
  // catalogue. The most-starred entries are monorepo subpaths with no one-line
  // install, so they will never have a verdict, and the readers most likely to
  // arrive were guaranteed to find nothing. `verdictConstraint()` already
  // handles an absent verdict by forbidding any claim about installing, so the
  // review is honest without one.
  const stale = or(
    isNull(plugins.reviewedAt),
    lt(plugins.reviewedAt, plugins.installCheckedAt),
  );

  const rows = await db
    .select()
    .from(plugins)
    .where(
      one
        ? eq(plugins.fullName, one)
        : and(
            eq(plugins.isArchived, false),
            isNotNull(plugins.readmeMd),
            force ? undefined : stale,
          ),
    )
    .orderBy(desc(plugins.stars))
    .limit(one ? 1 : limit);

  // A generation takes tens of seconds, almost all of it waiting, so running
  // these one at a time spends a day to do an hour's work. Concurrency is
  // bounded by the gateway's rate, not by ours: `rpm` spaces out when requests
  // may *start*, and the workers are only there to keep that spacing full.
  const rpm = Number(at("--rpm")) || 30;
  const workers = Math.min(Number(at("--concurrency")) || 12, rows.length);
  const spacing = 60_000 / rpm;

  console.log(
    `${rows.length} to review, model ${model}, ${workers} workers at ${rpm}/min\n`,
  );

  let nextStart = Date.now();
  let done = 0;
  let failed = 0;

  /** Hands out start times so the whole pool stays under the rate limit. */
  async function gate() {
    const at = Math.max(nextStart, Date.now());
    nextStart = at + spacing;
    const wait = at - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }

  const queue = [...rows];
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (;;) {
        const row = queue.shift();
        if (!row) return;
        await gate();

        try {
          const parts = await chatBlocks(
            `你在给一个 DeepSeek Harness 插件目录站写「AI 锐评」。这段话会标明是 AI 生成、仅供参考，读者最终以实际运行为准——所以它必须准确，不能靠含糊取巧。\n\n${RULES}\n\n${SHAPE}${verdictConstraint(row)}\n\n事实：\n${facts(row)}`,
            KEYS,
            { model, endpoint: endpoint(), maxTokens: 3000 },
          );

          const zh = render(parts, "zh");
          const en = render(parts, "en");

          // The shape guarantees four sections, so a model with nothing to say
          // fills one in rather than leaving it out — "未提供具体的适用场景"
          // was published under the most-visible card on the site. An empty
          // section is not a review; no review is better than a form with the
          // blanks read aloud.
          const hollow = NON_ANSWER.find((p) => p.test(zh) || p.test(en));
          if (hollow) {
            failed++;
            console.log(`  ✗ ${row.fullName}: hollow section (${hollow.source})`);
            continue;
          }

          if (dryRun) {
            console.log(`\n--- ${row.fullName} zh\n${zh}\n--- en\n${en}\n`);
            continue;
          }

          await persist(() =>
            db
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
              .where(eq(plugins.id, row.id)),
          );

          done++;
          if (done % 25 === 0 || done + failed === rows.length) {
            console.log(`  ${done + failed}/${rows.length} — ${done} ok, ${failed} failed`);
          }
        } catch (err) {
          failed++;
          console.log(`  ✗ ${row.fullName}: ${(err as Error).message.slice(0, 100)}`);
        }
      }
    }),
  );

  console.log(`\n${done} written, ${failed} failed`);
}

main();
