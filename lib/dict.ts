import type { Locale } from "@/lib/i18n";

/**
 * Every visible string, in both languages.
 *
 * The Chinese is written, not translated. Two rules run through it:
 *
 * 1. Product and ecosystem nouns stay in English — DeepSeek Harness, DSH,
 *    topic, npm, Star, tarball, commit, agent. Chinese developers type them in
 *    English and search for them in English; rendering them as 线束 or 星标
 *    would be both unidiomatic and a keyword own-goal.
 * 2. Everything else is written the way a Chinese developer writes, not the
 *    way a translator would. "装之前先看一眼" rather than "安装前请仔细阅读".
 *
 * The head term is `DeepSeek Harness 插件`, taken verbatim from Baidu
 * autocomplete, with `DSH 插件` and `插件大全` as the secondaries. They lead
 * the title, the H1 and the first paragraph.
 */

const en = {
  brand: "DSH Marketplace",
  localeName: "English",
  switchTo: "中文",

  meta: {
    title: "DeepSeek Harness Plugins — Browse & Install DSH Plugins",
    description:
      "Browse 1,000+ DeepSeek Harness plugins. Every listing shows the install command, the source repo, the licence and what the plugin can reach. Free, no sign-up.",
  },

  nav: {
    plugins: "Plugins",
    install: "Install",
    how: "How it works",
    api: "API",
    submit: "Submit a plugin",
  },

  footer: {
    blurb:
      "A directory for discovering practical plugins built for DeepSeek Harness. Browse the source, check the install notes, then extend the profile you actually use.",
    directory: "Directory",
    explore: "Explore plugins",
    api: "Public API",
    faq: "FAQ",
    project: "Project",
    about: "About",
    contact: "Contact",
    githubTopic: "GitHub topic",
    legal: "Legal",
    terms: "Terms",
    privacy: "Privacy",
    disclaimer:
      "Independent project · Not affiliated with DeepSeek · Listing is not an endorsement",
  },

  hero: {
    eyebrow: "Independent directory · Free, no sign-up",
    h1a: "DeepSeek Harness plugins,",
    h1b: "one command away.",
    lede: (n: string) =>
      `Browse ${n} DeepSeek Harness plugins indexed from the community registry and the`,
    ledeTail:
      " GitHub topic. Every listing shows the install command, the source repo, the licence, and what the plugin can reach — before you run anything.",
    installEyebrow: "Install any plugin",
    installNote:
      "Resolves the plugin, picks npm over a full clone when it can, and hands DSH the right command. No global install.",
    browse: "Browse the catalogue",
    statPlugins: "Plugins indexed",
    statCategories: "Categories",
    statPages: "Detail pages live",
    statSynced: "Last sync",
  },

  browse: {
    eyebrow: "The catalogue",
    heading: "Every DeepSeek Harness plugin",
    lede: "Synced from the community registry and the dsh-plugin GitHub topic. Star counts and last-push dates come straight from GitHub.",
    unit: (one: boolean): string => (one ? "plugin" : "plugins"),
    matching: (q: string) => ` matching “${q}”`,
    searchPlaceholder: "Search by name, capability or author…",
    searchLabel: "Search plugins",
    categoriesLabel: "Categories",
    all: "All",
    sort: "Sort",
    sortStars: "Stars",
    sortUpdated: "Updated",
    sortNew: "New",
    sortName: "A–Z",
    pagination: "Pagination",
    prev: "← Previous",
    next: "Next →",
    emptyTitle: (q?: string) => `Nothing matched${q ? ` “${q}”` : ""}`,
    emptyBodyA: "Plugin names follow the",
    emptyBodyB:
      "convention, and most descriptions are written in English or Chinese — try a capability instead of a product name, like “memory”, “vision” or “terminal”.",
    clear: "Clear filters",
  },

  linuxdo: {
    eyebrow: "Community-verified",
    heading: "Posted by their authors on LINUX DO",
    lede: "Every plugin here was published to LINUX DO by the person who wrote it, and the thread is linked from the listing. Hand-checked, so this list stays short — it is the one signal on this site that cannot be generated.",
    badge: "LINUX DO",
    viewThread: "Read the thread",
    filter: "LINUX DO only",
    submitPrompt: "Posted your plugin on LINUX DO?",
    submitCta: "Send us the thread",
    empty: "No verified threads yet.",
  },

  featured: {
    eyebrow: "Most starred",
    heading: "The DeepSeek Harness plugins people actually install",
    lede: "Ranked by GitHub stars, refreshed on every sync. Star counts say a repository is noticed, not that it is maintained — every card carries its last-push date too.",
    viewAll: (n: string) => `Browse all ${n}`,
    metaTitle: "Browse DeepSeek Harness Plugins — Search 1,000+ DSH Plugins",
    metaDescription:
      "Search 1,000+ DeepSeek Harness plugins by capability, category or author. Every listing shows the install command, the licence and what the plugin can reach.",
  },

  submitForm: {
    urlLabel: "Public GitHub repository",
    urlHelp:
      "Use the repository root URL. Private, archived and disabled projects cannot be listed.",
    inspect: "Inspect repository",
    noDescription: "No repository description — this becomes your card summary, so it is worth adding.",
    topicYes: "Tagged dsh-plugin, so the next sync would find it anyway.",
    topicNo: "Not tagged dsh-plugin. Adding the topic lists you automatically, here and in every other DSH plugin market.",
    licenceYes: (l: string) => `Licensed under ${l}.`,
    licenceNo: "No licence file. Code without one is all-rights-reserved by default, and the listing says so.",
    descriptionYes: "Has a repository description.",
    descriptionNo: "No description set. One sentence about the capability reads better than a blank card.",
    alreadyListed: "This repository is already in the catalogue.",
    viewListing: "View the listing",
    noteLabel: "Anything we should know (optional)",
    notePlaceholder:
      "Which DSH version it targets, what it needs access to, whether it replaces a built-in plugin…",
    emailLabel: "Contact email (optional)",
    emailHelp:
      "Only used to reach you about this submission. Not subscribed to anything.",
    submit: "Submit for review",
    received: "Submission received",
    alreadyQueued: "Already in the queue",
    receivedBody: (name: string) =>
      `${name} is queued for review. Listings are checked by hand before they are published, so this is not instant.`,
    fasterRoute:
      "The faster route is still the topic: tag the repository dsh-plugin and the next sync picks it up without a review queue.",
    genericError: "That did not work. Check the URL and try again.",
    networkError: "Could not reach the server. Try again in a moment.",
  },

  review: {
    badge: "AI take",
    title: "AI review",
    close: "Close",
    heading: "The AI take",
    readSource: "Read the source",
    disclaimer:
      "Generated, and a starting point rather than a verdict. Where it says a plugin installs or does not, that is from a real run in a clean profile — everything else is read off the repository. Trust the source over this.",
    disclaimerWithModel: (m: string) =>
      `Generated by ${m}, and a starting point rather than a verdict. Where it says a plugin installs or does not, that is from a real run in a clean profile — everything else is read off the repository. Trust the source over this.`,
  },

  card: {
    noDescription: "No description published yet.",
    noInstallCommand:
      "No one-line install — this plugin lives inside a larger repository and publishes no npm package.",
    details: "Details",
    source: "Source",
    linuxdo: "Discussed on LINUX DO",
  },

  how: {
    eyebrow: "How it works",
    heading: "How to install a DeepSeek Harness plugin",
    steps: [
      {
        title: "Find what you need",
        body: "Search by capability rather than product name. Every listing carries its category, primary language, star count and last-push date, so a dormant project is obvious before you install it.",
      },
      {
        title: "Check what it reaches",
        body: "Listings flag build scripts, terminal surfaces and credential prompts where we can detect them, and always link the source. A listing here is not a security review — plugins run with your agent's permissions.",
      },
      {
        title: "Install in one line",
        body: "Copy the command straight from the card, or let the CLI resolve it. Plugins published to npm install from a tarball; everything else installs from a pinned GitHub source.",
      },
    ],
  },

  faq: {
    eyebrow: "Questions",
    heading: "DeepSeek Harness plugins, answered",
    items: [
      {
        q: "What is DeepSeek Harness?",
        a: "DeepSeek Harness (DSH) is DeepSeek's open-source agent harness, built on the Cordis plugin kernel. The model supplies the reasoning; the harness gives it tools, sessions, sandboxes and a UI. Every capability — including the model connector itself — is a plugin that can be swapped or removed at runtime.",
      },
      {
        q: "How do I install DeepSeek Harness plugins?",
        a: "Run dsh plugin add followed by the source. Plugins published to npm install from a tarball, which is faster than cloning; everything else installs from a pinned GitHub commit. Every listing on this site shows the exact command for that plugin, ready to copy.",
      },
      {
        q: "Where can I find DeepSeek Harness plugins on GitHub?",
        a: "Community plugins tag themselves with the dsh-plugin topic on GitHub. That topic is one of the two sources this directory syncs from; the other is the curated community registry that DSH's built-in plugin market installs from. Listings show which of the two a plugin came from.",
      },
      {
        q: "Is DSH the same as DeepSeek Harness?",
        a: "Yes. DSH is the abbreviation used by the project and its CLI command. A repository named dsh-something is almost always a DeepSeek Harness plugin. Note that unrelated products also use the initials DSH, so a plain search for them returns noise.",
      },
      {
        q: "What is the best harness for DeepSeek models?",
        a: "DeepSeek Harness is the first-party option and the one this catalogue covers. Which plugins you add matters more than the harness itself: a memory plugin, a vision bridge for text-only models, and a terminal UI cover most of what people add first.",
      },
      {
        q: "Are DeepSeek Harness plugins safe to install?",
        a: "Treat them as untrusted code. Plugins run with your agent's permissions, and a listing here is not a security review. Listings flag install scripts, terminal surfaces and credential prompts where they are detectable, and always link the source so you can read it first.",
      },
    ],
  },

  plugin: {
    breadcrumb: "Plugins",
    installEyebrow: "Install",
    installHeading: (name: string) => `Add ${name} to DeepSeek Harness`,
    via: (label: string) => `via ${label}`,
    dueEyebrow: "Due diligence",
    dueHeading: (name: string) => `Before you install ${name}`,
    sourceOfRecord: "Source of record:",
    inRegistry:
      " — present in the community registry that DSH's own plugin market installs from.",
    notInRegistry:
      " — discovered via the dsh-plugin GitHub topic; not in the curated registry.",
    licensed: (l: string) => `Licensed under ${l}.`,
    noLicence:
      "No licence file detected. Code without a licence is all-rights-reserved by default.",
    detected: (f: string) =>
      `Detected: ${f}. Read the source before granting these.`,
    notAReview:
      "A listing here is not a security review. Plugins run with your agent's permissions.",
    overviewHeading: (name: string) => `What ${name} does`,
    readmeHeading: (name: string) => `${name} documentation`,
    docsNote:
      "Written from the project's own documentation and kept in sync with it. Where the two disagree, the source is authoritative —",
    docsSource: "read the README on GitHub",
    relatedEyebrow: "Same category",
    relatedHeading: (name: string) => `Alternatives to ${name}`,
    metaTitle: (name: string, owner: string) =>
      `${name} — DeepSeek Harness plugin by ${owner}`,
    metaFallback: (name: string) =>
      `${name}, a DeepSeek Harness (DSH) plugin. Install command, source, permissions and alternatives.`,
  },

  install: {
    npmNote:
      "Resolves a published tarball rather than cloning the repository, and installs without any extra setup. Swap `web` for your profile name if you run another one.",
    githubNote:
      "Installing from GitHub runs the project's build script, which pnpm blocks until you allowlist it — run the command once and pnpm prints the exact key to add under `allowBuilds` in ~/.dsh/profiles/web/pnpm-workspace.yaml.",
    subpathUnsupported:
      "This plugin lives in a subdirectory of a larger repository, and `dsh plugin add` cannot reach it — it forwards to pnpm, which reads everything after `#` as a git branch or commit. Clone the repository and add the plugin through DSH's plugin panel using a repository source, or ask the author to publish it to npm.",
    kindNpm: "npm package",
    kindGithub: "GitHub source",
    kindBundle: "DSH bundle",
    kindSkill: "Agent skill",
  },

  copy: {
    idle: "Copy",
    done: "Copied",
  },
};

export type Dict = typeof en;

const zh: Dict = {
  brand: "DSH Marketplace",
  localeName: "简体中文",
  switchTo: "EN",

  meta: {
    // "插件大全" is how this kind of page is actually searched for on Baidu —
    // `deepseek插件大全列表` is a live suggestion. It carries the head term
    // and the intent in four characters.
    title: "DeepSeek Harness 插件大全 — DSH 插件搜索与安装",
    description:
      "收录 1,000+ 个 DeepSeek Harness 插件。每个插件都标好安装命令、源码仓库、开源协议，以及它能碰到什么。免费，免注册。",
  },

  nav: {
    plugins: "插件",
    install: "安装",
    how: "怎么用",
    api: "API",
    submit: "提交插件",
  },

  footer: {
    blurb:
      "一个 DeepSeek Harness 插件索引站。按能力找到插件，翻一眼源码和安装说明，再装进你自己那套配置里。",
    directory: "索引",
    explore: "浏览插件",
    api: "公开 API",
    faq: "常见问题",
    project: "项目",
    about: "关于",
    contact: "联系",
    githubTopic: "GitHub topic",
    legal: "条款",
    terms: "使用条款",
    privacy: "隐私",
    disclaimer: "独立项目 · 与 DeepSeek 官方无隶属关系 · 收录不代表推荐",
  },

  hero: {
    eyebrow: "DSH 插件独立索引站 · 免费，免注册",
    // The head term leads the H1 verbatim, same as the English side.
    h1a: "DeepSeek Harness 插件，",
    h1b: "一行命令装好。",
    lede: (n: string) =>
      `收录 ${n} 个 DeepSeek Harness 插件，来自社区精选库和 GitHub 上的`,
    ledeTail:
      " topic。每条记录都写清安装命令、源码仓库、开源协议，以及这个插件能碰到什么——在你运行它之前。",
    installEyebrow: "安装任意 DSH 插件",
    installNote:
      "自动解析插件来源，能走 npm 就不克隆整个仓库，然后把命令交给 DSH。不用全局安装。",
    browse: "浏览全部插件",
    statPlugins: "已收录插件",
    statCategories: "分类",
    statPages: "已上线详情页",
    statSynced: "最近同步",
  },

  browse: {
    eyebrow: "插件索引",
    heading: "DeepSeek Harness 插件大全",
    lede: "这些 DSH 插件同步自社区精选库和 GitHub 的 dsh-plugin topic。Star 数、最近推送时间直接取自 GitHub。",
    unit: () => "个插件",
    matching: (q: string) => `，匹配「${q}」`,
    searchPlaceholder: "按名称、能力或作者搜索…",
    searchLabel: "搜索插件",
    categoriesLabel: "分类",
    all: "全部",
    sort: "排序",
    sortStars: "Star 数",
    sortUpdated: "最近更新",
    sortNew: "最新收录",
    sortName: "名称",
    pagination: "分页",
    prev: "← 上一页",
    next: "下一页 →",
    emptyTitle: (q?: string) => (q ? `没有匹配「${q}」的插件` : "没有匹配的插件"),
    emptyBodyA: "插件名基本都遵循",
    emptyBodyB:
      "的命名习惯，描述有中文也有英文。与其搜产品名，不如搜能力——比如「记忆」「视觉」「终端」。",
    clear: "清除筛选条件",
  },

  linuxdo: {
    eyebrow: "社区认证",
    heading: "作者在 LINUX DO 亲自发过的插件",
    lede: "这里每一个插件，都是作者本人在 LINUX DO 发过帖的，记录里直接链到那个帖子。人工核对，所以这个列表不会长——它是本站唯一一个生成不出来的信号。",
    badge: "LINUX DO",
    viewThread: "看原帖",
    filter: "只看 LINUX DO",
    submitPrompt: "你在 LINUX DO 发过自己的插件？",
    submitCta: "把帖子链接发给我们",
    empty: "还没有已核对的帖子。",
  },

  featured: {
    eyebrow: "Star 最多",
    heading: "大家真正在装的 DeepSeek Harness 插件",
    lede: "按 GitHub Star 排序，每次同步都会刷新。Star 多只说明有人关注，不代表还有人维护——所以每张卡片都带上了最近推送时间。",
    viewAll: (n: string) => `浏览全部 ${n} 个`,
    metaTitle: "DeepSeek Harness 插件搜索 — 1,000+ DSH 插件按能力筛选",
    metaDescription:
      "按能力、分类或作者搜索 1,000+ 个 DeepSeek Harness 插件。每条记录都标好安装命令、开源协议，以及这个插件能碰到什么。",
  },

  submitForm: {
    urlLabel: "公开的 GitHub 仓库",
    urlHelp: "填仓库根地址。私有、已归档、已停用的项目无法收录。",
    inspect: "检查仓库",
    noDescription: "仓库没有写描述——它会变成你卡片上那句摘要，值得补一句。",
    topicYes: "已经打了 dsh-plugin topic，下一轮同步本来也会收录。",
    topicNo:
      "没有打 dsh-plugin topic。打上之后会被自动收录，这边和其他所有 DSH 插件市场都一样。",
    licenceYes: (l: string) => `开源协议：${l}。`,
    licenceNo:
      "没有协议文件。没有协议的代码默认保留全部权利，记录上会照实写。",
    descriptionYes: "仓库有描述。",
    descriptionNo: "没有设置描述。写一句这插件能干什么，比留空好看得多。",
    alreadyListed: "这个仓库已经在收录里了。",
    viewListing: "看看这条记录",
    noteLabel: "有什么要说明的（选填）",
    notePlaceholder: "针对哪个 DSH 版本、需要哪些权限、会不会替换掉某个内置插件……",
    emailLabel: "联系邮箱（选填）",
    emailHelp: "只用来就这次提交联系你，不会订阅任何东西。",
    submit: "提交审核",
    received: "已收到",
    alreadyQueued: "已经在队列里了",
    receivedBody: (name: string) =>
      `${name} 已经排进审核队列。记录都要人工过一遍才会发布，所以不是立刻上线。`,
    fasterRoute:
      "更快的办法还是打 topic：给仓库加上 dsh-plugin，下一轮同步会直接收录，不用排队。",
    genericError: "没成功。检查一下地址再试。",
    networkError: "连不上服务器，过一会儿再试。",
  },

  review: {
    badge: "AI 锐评",
    title: "AI 锐评",
    close: "关闭",
    heading: "AI 锐评",
    readSource: "去看源码",
    disclaimer:
      "机器写的，只当参考，不当结论。里面说装得上或装不上，是在干净 profile 里真跑过的；其余都是读仓库读出来的。以实际运行为准。",
    disclaimerWithModel: (m: string) =>
      `${m} 写的，只当参考，不当结论。里面说装得上或装不上，是在干净 profile 里真跑过的；其余都是读仓库读出来的。以实际运行为准。`,
  },

  card: {
    noDescription: "作者还没写描述。",
    noInstallCommand:
      "没有一行式安装命令——这个插件在一个大仓库的子目录里，也没发 npm 包。",
    details: "详情",
    source: "源码",
    linuxdo: "LINUX DO 讨论帖",
  },

  how: {
    eyebrow: "怎么用",
    heading: "怎么安装 DeepSeek Harness 插件",
    steps: [
      {
        title: "先按能力找",
        body: "别搜产品名，搜你要的那个能力。每条记录都带分类、主语言、Star 数和最近推送时间，一个项目是不是已经没人管了，装之前就看得出来。",
      },
      {
        title: "看清它能碰到什么",
        body: "凡是能自动识别出来的，本站都会标出来：安装脚本、终端执行、需要密钥，并且每条记录都直连源码。收录不等于做过安全审计——插件是带着你 agent 的权限在跑。",
      },
      {
        title: "一行命令装好",
        body: "命令直接从卡片上复制，或者交给 CLI 去解析。发布到 npm 的插件走 tarball，其余的从锁定的 GitHub 源装。",
      },
    ],
  },

  faq: {
    eyebrow: "常见问题",
    heading: "关于 DeepSeek Harness 插件，你可能想问的",
    // Questions are lifted from Baidu autocomplete rather than translated from
    // the English FAQ — "社区插件有哪些" and "收费吗" are what Chinese users
    // actually type, and neither has an English counterpart above.
    items: [
      {
        q: "DeepSeek Harness 是什么？",
        a: "DeepSeek Harness（缩写 DSH）是 DeepSeek 开源的 agent harness，跑在 Cordis 插件内核上。模型负责推理，harness 负责给它工具、会话、沙箱和界面。这里所有能力——连接模型的那一层也算——都是插件，运行时可以换掉，也可以直接卸了。",
      },
      {
        q: "DeepSeek Harness 社区插件有哪些？",
        a: "本站收录了一千多个，分成十四类：记忆、视觉与多模态、终端界面、通知集成、用量计费等等。来源有两个，一个是社区精选库（DSH 自带的插件市场就是从这儿装的），另一个是 GitHub 上打了 dsh-plugin topic 的公开仓库。每条记录都注明来自哪边。",
      },
      {
        q: "DeepSeek Harness 插件怎么安装？",
        a: "命令是 dsh plugin add，后面跟来源。发布到 npm 的插件直接拉 tarball，比克隆整个仓库快；其余的从锁定的 GitHub commit 装。本站每条记录都把对应命令写好了，复制就能用。",
      },
      {
        q: "DSH 就是 DeepSeek Harness 吗？",
        a: "是。DSH 是项目自己用的缩写，也是它命令行的名字。仓库名叫 dsh-什么什么的，基本都是 DeepSeek Harness 插件。要留神的是 DSH 这三个字母还被别的产品占着，直接搜会搜出一堆不相干的东西。",
      },
      {
        q: "DeepSeek Harness 收费吗？",
        a: "DeepSeek Harness 本身开源免费，本站收录的插件也都是公开仓库，不收钱也不用注册。真正花钱的是模型调用本身——你接哪家的 API 就按哪家的价格算；另外有些插件需要你自己填第三方服务的密钥。",
      },
      {
        q: "DeepSeek Harness 插件安全吗？",
        a: "当成不可信代码来对待。插件是带着你 agent 的权限跑的，被收录在这里不代表通过了安全审计。凡是能自动识别的本站都会标出来：安装脚本、终端执行、需要密钥——但识别是启发式的，没标不等于干净。每条记录都直连源码，装之前先看一眼。",
      },
    ],
  },

  plugin: {
    breadcrumb: "插件",
    installEyebrow: "安装",
    installHeading: (name: string) => `把 ${name} 装进 DeepSeek Harness`,
    via: (label: string) => `${label} 方式`,
    dueEyebrow: "安装前须知",
    dueHeading: (name: string) => `装 ${name} 之前，先看这几条`,
    sourceOfRecord: "源码在这里：",
    inRegistry: "——已进入社区精选库，DSH 自带的插件市场就是从这儿装的。",
    notInRegistry:
      "——从 GitHub 的 dsh-plugin topic 发现，没有进入人工审过的精选库。",
    licensed: (l: string) => `开源协议：${l}。`,
    noLicence: "没检测到协议文件。没有协议的代码，默认保留全部权利。",
    detected: (f: string) => `自动识别到：${f}。授权之前请先读一遍源码。`,
    notAReview:
      "被收录在这里不代表通过了安全审计。插件是带着你 agent 的权限在跑。",
    overviewHeading: (name: string) => `${name} 是做什么的`,
    readmeHeading: (name: string) => `${name} 的文档`,
    docsNote:
      "根据项目自己的文档整理，会跟着上游更新。两边对不上时以源码仓库为准——",
    docsSource: "去 GitHub 看原始 README",
    relatedEyebrow: "同一分类",
    relatedHeading: (name: string) => `${name} 的同类插件`,
    metaTitle: (name: string, owner: string) =>
      `${name} — ${owner} 的 DeepSeek Harness 插件`,
    metaFallback: (name: string) =>
      `${name}，一个 DeepSeek Harness（DSH）插件。安装命令、源码、权限范围和同类替代都在这里。`,
  },

  install: {
    npmNote:
      "直接拉已发布的 tarball，不用克隆整个仓库，也不需要额外配置。如果你用的是别的 profile，把 `web` 换成对应的名字。",
    githubNote:
      "从 GitHub 装会执行项目自己的构建脚本，而 pnpm 默认拦着不让跑——先跑一次这条命令，pnpm 会打印出要加到 ~/.dsh/profiles/web/pnpm-workspace.yaml 里 `allowBuilds` 下面的那个 key。",
    subpathUnsupported:
      "这个插件放在一个大仓库的子目录里，`dsh plugin add` 够不到它——它转发给 pnpm，而 pnpm 会把 `#` 后面的内容当成分支或 commit。请先 clone 仓库，再用 DSH 插件面板的 repository 源添加，或者请作者发一个 npm 包。",
    kindNpm: "npm 包",
    kindGithub: "GitHub 源码",
    kindBundle: "DSH 插件包",
    kindSkill: "Agent 技能包",
  },

  copy: {
    idle: "复制",
    done: "已复制",
  },
};

const DICTS: Record<Locale, Dict> = { en, zh };

export function t(locale: Locale): Dict {
  return DICTS[locale];
}
