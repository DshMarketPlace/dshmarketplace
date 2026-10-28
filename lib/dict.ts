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
      "Browse every DeepSeek Harness plugin. Each listing shows the install command, the source repo, the licence and what the plugin can reach — and whether it actually installs. Free, no sign-up.",
  },

  cart: {
    add: "Add",
    added: "Added",
    remove: "Remove",
    clear: "Clear",
    count: (n: number) => `${n} plugin${n === 1 ? "" : "s"} selected`,
    full: (n: number) => `${n} is the limit — past that it stops being a command you paste.`,
    recommended: "Install them all",
    recommendedWhy:
      "Installs into whichever profile DeepSeek Harness actually created on your machine, skips anything the sandbox could not install, and allowlists a blocked build script so nothing lands inert.",
    manual: "Or paste it yourself",
    brokenWarning: (names: string) =>
      `The sandbox could not install ${names}. The command above will skip it; the one below will not.`,
  },

  presets: {
    eyebrow: "Presets",
    // The head term on both sides of the language split is "plugin market" —
    // Google completes `deepseek harness plugin market`, Baidu completes
    // `deepseek harness 插件市场` and `dsh插件商店`. There is no preset or
    // "best plugins" long-tail in either language yet, so this section is
    // about sets and earns its traffic on market and install intent instead of
    // on a term nobody types.
    heading: "DeepSeek Harness plugin sets, installed together first",
    lede: "The rest of this DeepSeek Harness plugin market lists one plugin at a time, and a verdict on a single plugin says nothing about the company it keeps. Each set below went into one clean profile as a single install, and every plugin in it had to register before the set was published.",
    verifiedOn: "verified",
    countLabel: (n: number) => `${n} plugin${n === 1 ? "" : "s"}`,
    installAll: "Install a set with one command",
    installNote:
      "Installs into whichever profile DeepSeek Harness actually created on your machine, skips anything the sandbox could not install, and allowlists a blocked build script so nothing lands inert.",
    viewAll: "All sets, and what is in them",
  },

  nav: {
    plugins: "Plugins",
    top: "Top",
    menu: "Menu",
    presets: "Presets",
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
    installFailed: "Install failed?",
    weekly: "Weekly report",
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
    installSectionHeading: "Install any plugin",
    installNote:
      "Resolves the plugin, picks npm over a full clone when it can, and hands DSH the right command. No global install.",
    searchPlaceholder: "Search plugins by name, capability or author…",
    searchAction: "Search",
    browse: "Browse the catalogue",
    statPlugins: "Plugins indexed",
    statCategories: "Categories",
    statTested: "Install-tested",
    statPages: "Detail pages live",
    statSynced: "Last sync",
    // The differentiator, stated plainly: a scraper can copy the repo, but not
    // the record of installing it. Reads over the plugins actually run, never
    // the whole catalogue.
    installVerifiedLead: (rate: number, tested: string, dsh: string) =>
      `${rate}% of the ${tested} plugins we ran on DeepSeek Harness ${dsh} in a throwaway sandbox install`,
    installMethodologyCta: "How we test",
  },

  browse: {
    eyebrow: "The catalogue",
    heading: "Every DeepSeek Harness plugin",
    lede: "Synced from the community registry and the dsh-plugin GitHub topic. Star counts and last-push dates come straight from GitHub.",
    unit: (one: boolean): string => (one ? "plugin" : "plugins"),
    matching: (q: string) => ` matching “${q}”`,
    installVerified: (rate: number, dsh: string) =>
      `${rate}% install-verified on DeepSeek Harness ${dsh}`,
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
    // Took the count as a parameter after the hardcoded "1,000+" spent three
    // days understating a catalogue that had passed 3,400 — and it is the
    // title Google shows.
    metaTitle: (n: string) =>
      `Browse DeepSeek Harness Plugins — Search ${n} DSH Plugins`,
    metaDescription:
      "Search every DeepSeek Harness plugin by capability, category or author. Every listing shows the install command, the licence and what the plugin can reach.",
    categoryMetaTitle: (name: string) =>
      `${name} — DeepSeek Harness Plugins | DSH Marketplace`,
    categoryMetaDescription: (name: string) =>
      `DeepSeek Harness plugins for ${name.toLowerCase()}, each with the install command that works, the licence, and what the plugin can reach.`,
  },

  submitForm: {
    urlLabel: "Public GitHub repository",
    urlHelp:
      "Use the repository root URL. Private, archived and disabled projects cannot be listed.",
    inspect: "Inspect repository",
    noDescription:
      "No repository description — this becomes your card summary, so it is worth adding.",
    topicYes: "Tagged dsh-plugin, so the next sync would find it anyway.",
    topicNo:
      "Not tagged dsh-plugin. Adding the topic lists you automatically, here and in every other DSH plugin market.",
    licenceYes: (l: string) => `Licensed under ${l}.`,
    licenceNo:
      "No licence file. Code without one is all-rights-reserved by default, and the listing says so.",
    descriptionYes: "Has a repository description.",
    descriptionNo:
      "No description set. One sentence about the capability reads better than a blank card.",
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

  // Said about the command directly above it, because that is all it is about:
  // this exact line was run in a clean profile in a throwaway container.
  installCheck: {
    passed: "Installed cleanly when we ran it",
    needsApproval: "Installs, but needs a build approved first",
    notALayer: "Installs, but not as a profile layer",
    failed: "Did not install when we ran it",
    timeout: "Took too long to install when we ran it",
    incompatible: (dsh: string | null) =>
      `DeepSeek Harness ${dsh ?? ""} refuses the latest release`.replace("  ", " "),
    incompatibleHelp: (dsh: string, ranges: string) =>
      `From 0.2 DeepSeek Harness checks a plugin's dsh range before installing anything, and refuses the whole command when the running version is outside it. The latest release asks for ${ranges}; we ran ${dsh}.`,
    fallbackWorks: (pkg: string, version: string, dsh: string) =>
      `${pkg}@${version} is the newest release DeepSeek Harness ${dsh} accepts, and it installed when we ran it:`,
    fallbackBlocked: (pkg: string, version: string) =>
      `${pkg}@${version} is the newest release this version accepts, but it did not install either when we ran it.`,
    noFallback: (dsh: string) =>
      `No release of it accepts DeepSeek Harness ${dsh} yet. \`dsh plugin allow-version … --accept-risk\` forces one in, at the risk the harness itself warns about; otherwise wait for an update.`,
    cliFits:
      "dshmarketplace-cli reads your dsh version and installs the release it accepts:",
    whyRefused: "Why DeepSeek Harness refuses plugins, and every way around it ›",
    sourceRefused:
      "This listing installs from source, so there is no older release to fall back to. `dsh plugin allow-version … --accept-risk` forces it in, at the risk the harness itself warns about; otherwise wait for the author to widen the range.",
    heading: "What happened when we ran it",
    approvalHelp:
      "pnpm refuses to run a package's build script until it is allowlisted. Add the key pnpm prints to allowBuilds in the profile's pnpm-workspace.yaml, then run the command again.",
    layerHelp:
      "The command works. The package declares no dsh.bundle, so the harness takes it as an ordinary dependency rather than a layer over your profile — use it the way its README describes. If a later version adds one, it activates on its own.",
    checkedAt: (when: string) => `Last run ${when}`,
    checkedOn: (dsh: string) => `on DeepSeek Harness ${dsh}`,
    method:
      "Every command here is run in a throwaway container against a clean profile, and the result is whatever the harness recorded — not a guess from the source.",
    badgeHeading: "Show it in your README",
    badgeAlt: "install verified — dshmarketplace",
    badgeNote:
      "For maintainers: the badge serves this listing's latest sandbox verdict, so a re-run updates it on its own — and it links readers to the full result here.",
  },

  // Every row names where it came from, because the three sources differ in
  // weight: one is an install we ran, two are text scans of the repository.
  security: {
    eyebrow: "Security",
    heading: (name: string) => `What installing ${name} runs`,
    buildLabel: "Build scripts",
    buildHeld:
      "pnpm held these build scripts for approval, and the plugin did not register until they were allowed:",
    buildSelf: "the plugin's own prepare script",
    buildApprove:
      "An approved script runs with your user account's permissions. DSH's Plugins page offers to allow them and retry — read the script before you do.",
    buildHeldEmpty:
      "pnpm held a build script for approval, and the plugin did not register until it was allowed. The run did not record which.",
    buildSkipped:
      "pnpm skipped these dependency build scripts, and the plugin registered without them:",
    buildSkippedNote:
      "Under pnpm 11 the install stops and asks you to approve them instead; an approved script runs with your user account's permissions.",
    buildNone: "No build script was blocked in our run.",
    buildNever: "Not measured — we have not installed it yet.",
    buildRefused: "Not measured — DSH refused the latest release before running anything.",
    buildIncomplete: "Not measured — the install did not complete.",
    buildSource: (dsh: string | null, when: string | null) =>
      `Source: our sandbox install${dsh ? ` on DeepSeek Harness ${dsh}` : ""}${when ? `, ${when}` : ""}.`,
    lifecycleLabel: "Install hooks",
    lifecycleYes:
      "package.json declares a preinstall, install or postinstall script, which runs when the package is installed.",
    lifecycleNo: "package.json declares no preinstall, install or postinstall script.",
    lifecycleSource:
      "Source: package.json on GitHub, read at our last sync. prepare is not recorded; it runs only on a GitHub install, and shows up under build scripts when pnpm blocks it.",
    readmeLabel: "README mentions",
    readmeTerminal: "shell commands (bash, exec, spawn …)",
    readmeCredentials: "API keys, tokens or passwords",
    readmeNo: "Neither shell commands nor credentials.",
    readmeSource:
      "Source: a keyword match on the README — a hint about what the plugin touches, not an analysis of its code.",
    notScanned: "Not checked yet.",
    footer:
      "Not an audit. These are the record of one install and two text scans; nobody has read this plugin's code on your behalf. Plugins run with your agent's permissions.",
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
    submittedByHand:
      " — added by hand from a community post; not in the curated registry.",
    licensed: (l: string) => `Licensed under ${l}.`,
    noLicence:
      "No licence file detected. Code without a licence is all-rights-reserved by default.",
    overviewHeading: (name: string) => `What ${name} does`,
    readmeHeading: (name: string) => `${name} documentation`,
    docsNote:
      "Written from the project's own documentation and kept in sync with it. Where the two disagree, the source is authoritative —",
    docsSource: "read the README on GitHub",
    relatedEyebrow: "Same category",
    relatedHeading: (name: string) => `Alternatives to ${name}`,
    // Appended, then truncated. A summary long enough to fill the snippet
    // pushes this off the end and stays unique; a short one — the Chinese
    // summaries run to about forty characters — gets the space filled rather
    // than shipping a near-empty SERP result. One rule, no branch.
    metaTail:
      " Install it into DeepSeek Harness with one command, verified in a sandbox.",
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

  top: {
    eyebrow: "Rankings",
    title: "The best DeepSeek Harness plugins, by what people install",
    lede: "Three rankings, each on a signal of its own: installs reported from inside DeepSeek Harness, this week's star gain, and stars among the plugins that installed in our sandbox on the version people run now.",
    installedHeading: "Most installed through dshmarketplace",
    installedNote:
      "Counted each time someone installs from the dshmarketplace store inside DeepSeek Harness. Stars measure attention; this measures use.",
    installedMetric: (n: number) => `${n.toLocaleString("en")} installs`,
    risingHeading: "Rising this week",
    risingNote: (from: string, to: string) =>
      `GitHub stars gained between the nightly snapshots of ${from} and ${to}.`,
    risingMetric: (n: number) => `+${n.toLocaleString("en")} ★ this week`,
    verifiedHeading: (dsh: string) => `Most-starred plugins that install on DeepSeek Harness ${dsh}`,
    verifiedNote:
      "Each one installed in a throwaway sandbox on that version — or an older release of it did, which dshmarketplace-cli picks for you.",
    verifiedMetric: (n: number) => `★ ${n.toLocaleString("en")}`,
    empty: "Not enough data for this one yet.",
    rank: (i: number) => `#${i}`,
  },

  weekly: {
    eyebrow: "Weekly report",
    listTitle: "DeepSeek Harness plugins, week by week",
    listLede:
      "One issue a week: what arrived in the catalogue, what climbed, what people installed from inside DeepSeek Harness, and what the current release refuses. Each issue is fixed the night it is written — the numbers are what we measured then.",
    listMetaTitle: "DeepSeek Harness Plugins Weekly — New, Rising & Most Installed",
    listMetaDescription:
      "A weekly report on DeepSeek Harness plugins: new arrivals, the week's GitHub star gains, installs from inside the harness, and what the current release refuses. Measured from nightly snapshots and sandbox runs.",
    listItem: (total: number, added: number) =>
      `${added.toLocaleString("en")} added · ${total.toLocaleString("en")} in the catalogue`,
    noIssues: "No issue has been published yet. The first one appears after a week of nightly snapshots.",
    issueTitle: (from: string, to: string) => `DeepSeek Harness plugins this week · ${from} → ${to}`,
    issueMetaTitle: (from: string, to: string) => `DeepSeek Harness Plugins Weekly, ${from} to ${to}`,
    issueMetaDescription: (from: string, to: string, added: number) =>
      `${added.toLocaleString("en")} new DeepSeek Harness plugins between ${from} and ${to}, the week's biggest star gains, the most installed, and what the current release refuses.`,
    lede: (total: number, added: number) =>
      `${total.toLocaleString("en")} plugins in the catalogue, ${added.toLocaleString("en")} added this week. Every number comes from the nightly snapshots and sandbox runs.`,
    frozen: (day: string) =>
      `Recorded from the snapshot of ${day} and not updated since: the catalogue keeps moving, this page keeps what we measured that night.`,
    allIssues: "All issues",
    releasesHeading: "DeepSeek Harness releases this week",
    arrivedHeading: "New this week, by stars",
    risingHeading: "Most stars gained",
    installedHeading: "Most installed from inside DeepSeek Harness",
    compatHeading: (dsh: string) => `Compatibility with DeepSeek Harness ${dsh}`,
    compatBody: (dsh: string, tested: number, refused: number, rescued: number) =>
      `${tested.toLocaleString("en")} plugins run on ${dsh}: ${refused.toLocaleString("en")} had their latest release refused, ${rescued.toLocaleString("en")} of those have an older release that installs.`,
    compatHelp: "If one will not install, read the fixes",
    cliLead: " — or run",
    cliCommand: "npx dshmarketplace-cli add <plugin>",
    cliTail: ", which picks a release your dsh accepts.",
    starsMetric: (n: number) => `★ ${n.toLocaleString("en")}`,
    gainedMetric: (n: number) => `+${n.toLocaleString("en")} ★`,
    installsMetric: (n: number) => `${n.toLocaleString("en")} installs`,
    noFit: "no release fits yet",
    none: "None this week.",
  },

  refusals: {
    plugin: "Plugin",
    needs: "Latest release needs dsh",
    installs: (dsh: string) => `Installs on ${dsh}`,
    none: "no release fits yet",
    empty: "Nothing refused on the current dsh so far.",
  },

  upgrade: {
    metaTitle: (v: string | null) =>
      v
        ? `DeepSeek Harness ${v} Plugin Compatibility — Which Plugins Stop Installing`
        : "DeepSeek Harness Upgrade Check — Which Plugins Stop Installing",
    metaDescription:
      "Paste your DeepSeek Harness plugins and see which ones the next and alpha releases refuse or fail to install — measured nightly in a sandbox, not guessed from package.json.",
    eyebrow: "Upgrade check",
    title: (v: string | null) =>
      v ? `DeepSeek Harness ${v} plugin compatibility` : "Will your plugins survive the next DeepSeek Harness?",
    lede: "Every night our sandbox takes plugins that install on npm latest and installs them again, into a clean profile, on the upcoming next and alpha releases of DeepSeek Harness. It measures one thing — whether the plugin still installs and registers on that release — and not whether it behaves the same once it runs.",
    label: "Your plugins",
    help: "Plugin names, npm names or github:owner/repo, one per line or separated by spaces. Or paste your profile's package.json and its dependencies are read.",
    placeholder: "dsh-better-sidebar\n@liustack/modlens\ngithub:owner/repo",
    check: "Check",
    nothingParsed: "Nothing in there looks like a plugin name.",
    networkError: "Could not reach the API. Try again in a moment.",
    overflow: (n: number) => `${n} more left out — the check takes 100 names at a time.`,
    skipped: (list: string) => `Not plugin names, skipped: ${list}`,
    plugin: "Plugin",
    now: "Today, on latest",
    notListed: "Not in the catalogue",
    notRun: "not run yet",
    ranOn: (v: string) => `ran on ${v}`,
    yours: (tag: string, dsh: string, broken: number, total: number) =>
      `${tag} (${dsh}): ${broken} of your ${total} would stop installing.`,
    verdicts: {
      passed: "installs",
      "needs-approval": "needs approval",
      "not-a-layer": "not a layer",
      failed: "fails",
      timeout: "timed out",
      incompatible: "refused",
      untested: "untested",
    } as Record<string, string>,
    summaryHeading: "What the sandbox found",
    tagLine: (tag: string, dsh: string, passed: number, checked: number, date: string) =>
      `${tag} — DeepSeek Harness ${dsh}: ${passed} of ${checked} plugins that install on latest still install. Last run ${date}.`,
    tagBreakdown: (refused: number, failed: number, approval: number) =>
      `${refused} refused by the version check, ${failed} failed or timed out, ${approval} need a build approved first.`,
    noRuns:
      "The first runs on next and alpha have not landed yet. They run nightly, about 150 plugins per release, most-installed first.",
    regressionsHeading: "Install on latest, not on the next release",
    regressionsNote:
      "Most-starred first. Only each plugin's newest run on the tag's current release counts.",
    regressionsEmpty: "None so far: every plugin checked on the upcoming releases still installs.",
    stars: "Stars",
    fixHeading: "If one of yours breaks",
    fixBody:
      "Refused means the plugin's declared dsh range does not cover that release, and only its author can widen engines.dsh. Until then, staying on the DeepSeek Harness you run now is the fix.",
    fixLink: "Why DeepSeek Harness refuses plugins, and every way around it ›",
    api: "The same data as JSON, CORS open, up to 100 names a call:",
    fromInstallFailed: "Thinking of updating DeepSeek Harness? Check which of your plugins the next release refuses ›",
  },

  // Read inside DeepSeek Harness's Discover tab, not on this site.
  market: {
    title: "dshmarketplace — install-verified",
    description:
      "Every release here was installed into a clean DeepSeek Harness profile in a throwaway sandbox before it was listed, and each is listed with the dsh versions it accepts.",
    labelRegistry: "In the community registry",
    labelLinuxdo: "Author verified on LINUX DO",
    labelOlderRelease: "Older release — the latest one needs a newer dsh",
    sortStars: "GitHub stars",
    sortInstalls: "Installs through dshmarketplace",
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
      "DeepSeek Harness 插件大全：每条都标好安装命令、源码仓库、开源协议，以及它能碰到什么——还有它到底装不装得上，是真装过一遍的结论。免费，免注册。",
  },

  cart: {
    add: "加入",
    added: "已加入",
    remove: "移除",
    clear: "清空",
    count: (n: number) => `已选 ${n} 个插件`,
    full: (n: number) => `最多 ${n} 个 —— 再多就不是一条能粘的命令了。`,
    recommended: "一条命令全装上",
    recommendedWhy:
      "装进你机器上 DeepSeek Harness 真正建出来的那个 profile，沙箱装不上的跳过，被拦的 build script 自动放行，不会装完是个死的。",
    manual: "或者自己粘这条",
    brokenWarning: (names: string) =>
      `沙箱装不上 ${names}。上面那条命令会跳过它，下面这条不会。`,
  },

  presets: {
    eyebrow: "预设",
    heading: "整套装过才发的 DeepSeek Harness 插件组合",
    lede: "这个 DeepSeek Harness 插件市场其他地方都是一条一条列的，而单个插件的结论说明不了它跟别人处不处得来。下面每一套都是整套当成一次安装、装进干净 profile 的，套里每个插件都得注册上，这套才发得出来。",
    verifiedOn: "实测",
    countLabel: (n: number) => `${n} 个插件`,
    installAll: "一条命令装一套",
    installNote:
      "装进你机器上 DeepSeek Harness 真正建出来的那个 profile，沙箱装不上的先跳过，被拦的 build script 自动放行，不会装完是个死的。",
    viewAll: "全部预设，以及每套装了什么",
  },

  nav: {
    plugins: "插件",
    top: "排行",
    menu: "菜单",
    presets: "预设",
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
    installFailed: "装不上？",
    weekly: "周报",
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
    installSectionHeading: "安装任意插件",
    installNote:
      "自动解析插件来源，能走 npm 就不克隆整个仓库，然后把命令交给 DSH。不用全局安装。",
    searchPlaceholder: "搜索插件名称、能力或作者…",
    searchAction: "搜索",
    browse: "浏览全部插件",
    statPlugins: "已收录插件",
    statCategories: "分类",
    statTested: "已实测安装",
    statPages: "已上线详情页",
    statSynced: "最近同步",
    // 差异化的一句话：repo 谁都能爬，但「装过一遍」的记录爬不走。分母只算真跑过的。
    installVerifiedLead: (rate: number, tested: string, dsh: string) =>
      `我们在 DeepSeek Harness ${dsh} 上把 ${tested} 个插件挨个丢进 sandbox 实装，${rate}% 装得上`,
    installMethodologyCta: "怎么测的",
  },

  browse: {
    eyebrow: "插件索引",
    heading: "DeepSeek Harness 插件大全",
    lede: "这些 DSH 插件同步自社区精选库和 GitHub 的 dsh-plugin topic。Star 数、最近推送时间直接取自 GitHub。",
    unit: () => "个插件",
    matching: (q: string) => `，匹配「${q}」`,
    installVerified: (rate: number, dsh: string) =>
      `${rate}% 在 DeepSeek Harness ${dsh} 上实测可装`,
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
    emptyTitle: (q?: string) =>
      q ? `没有匹配「${q}」的插件` : "没有匹配的插件",
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
    metaTitle: (n: string) =>
      `DeepSeek Harness 插件搜索 — ${n} 个 DSH 插件按能力筛选`,
    metaDescription:
      "按能力、分类或作者搜索 DeepSeek Harness 插件。每条记录都标好安装命令、开源协议，以及这个插件能碰到什么。",
    categoryMetaTitle: (name: string) =>
      `${name} — DeepSeek Harness 插件 | DSH Marketplace`,
    categoryMetaDescription: (name: string) =>
      `${name}方向的 DeepSeek Harness 插件，每条都带真能跑的安装命令、开源协议，以及这个插件能碰到什么。`,
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
    licenceNo: "没有协议文件。没有协议的代码默认保留全部权利，记录上会照实写。",
    descriptionYes: "仓库有描述。",
    descriptionNo: "没有设置描述。写一句这插件能干什么，比留空好看得多。",
    alreadyListed: "这个仓库已经在收录里了。",
    viewListing: "看看这条记录",
    noteLabel: "有什么要说明的（选填）",
    notePlaceholder:
      "针对哪个 DSH 版本、需要哪些权限、会不会替换掉某个内置插件……",
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

  installCheck: {
    passed: "我们跑过，装得上",
    needsApproval: "装得上，但要先放行构建脚本",
    notALayer: "装得上，但不是 profile layer",
    failed: "我们跑过，没装上",
    timeout: "我们跑过，装到超时",
    incompatible: (dsh: string | null) =>
      `DeepSeek Harness ${dsh ?? ""} 拒装最新版`.replace("  ", " "),
    incompatibleHelp: (dsh: string, ranges: string) =>
      `从 0.2 起，DeepSeek Harness 装插件前会先核对它声明的 dsh 版本范围，当前版本不在范围内就整条命令拒掉。最新版要求 ${ranges}，我们跑的是 ${dsh}。`,
    fallbackWorks: (pkg: string, version: string, dsh: string) =>
      `DeepSeek Harness ${dsh} 能接受的最新一版是 ${pkg}@${version}，我们实装过，装得上：`,
    fallbackBlocked: (pkg: string, version: string) =>
      `这个版本能接受的最新一版是 ${pkg}@${version}，但我们实装时它也没装上。`,
    noFallback: (dsh: string) =>
      `它还没有哪一版接受 DeepSeek Harness ${dsh}。\`dsh plugin allow-version … --accept-risk\` 可以硬装，风险 harness 自己已经写明了；不然就等作者更新。`,
    cliFits: "dshmarketplace-cli 会读你本机的 dsh 版本，自动装它能接受的那一版：",
    whyRefused: "DeepSeek Harness 为什么拒装、有哪些绕过办法 ›",
    sourceRefused:
      "这条是从源码装的，没有旧版本可退。`dsh plugin allow-version … --accept-risk` 可以硬装，风险 harness 自己已经写明了；不然就等作者把版本范围放宽。",
    heading: "我们跑过之后",
    approvalHelp:
      "pnpm 不会执行没进白名单的构建脚本。把 pnpm 打印出来的那个 key 加进 profile 里 pnpm-workspace.yaml 的 allowBuilds，再跑一次即可。",
    layerHelp:
      "命令是好的。它的 package.json 里没写 dsh.bundle，所以 harness 把它当普通依赖收下，而不是叠一层到你的 profile 上——按它 README 说的方式用就行。以后哪个版本补上了，会自己生效。",
    checkedAt: (when: string) => `最近一次 ${when}`,
    checkedOn: (dsh: string) => `，DeepSeek Harness ${dsh}`,
    method:
      "这里每条命令都在一次性容器里、对着干净 profile 真跑过，结果取自 harness 自己的记录，不是读源码猜的。",
    badgeHeading: "挂进你的 README",
    badgeAlt: "实测可装 — dshmarketplace",
    badgeNote:
      "给维护者的：badge 取这条 listing 最近一次 sandbox 实测的结果，重跑之后它自己会变，读者点开就是这页的完整记录。",
  },

  security: {
    eyebrow: "安全",
    heading: (name: string) => `装 ${name} 会执行什么`,
    buildLabel: "构建脚本",
    buildHeld: "pnpm 把下面这些构建脚本拦下来等你放行，放行之前插件不会注册：",
    buildSelf: "插件自己的 prepare 脚本",
    buildApprove:
      "放行之后，脚本以你当前用户的权限执行。DSH 的 Plugins 页面会提示放行并重试——放行前先看一眼脚本写了什么。",
    buildHeldEmpty:
      "pnpm 拦下了一个构建脚本等你放行，放行之前插件不会注册。这次运行没记下是哪个。",
    buildSkipped: "pnpm 跳过了下面这些依赖的构建脚本，插件没有它们也注册上了：",
    buildSkippedNote:
      "换成 pnpm 11，安装会停下来先让你放行；放行之后，脚本以你当前用户的权限执行。",
    buildNone: "我们这次实装里没有构建脚本被拦。",
    buildNever: "没测到——还没实装过。",
    buildRefused: "没测到——DSH 在执行任何东西之前就拒装了最新版。",
    buildIncomplete: "没测到——安装没有跑完。",
    buildSource: (dsh: string | null, when: string | null) =>
      `来源：我们在沙箱里的实装${dsh ? `，DeepSeek Harness ${dsh}` : ""}${when ? `，${when}` : ""}。`,
    lifecycleLabel: "安装钩子",
    lifecycleYes: "package.json 里声明了 preinstall / install / postinstall 脚本，装包时会执行。",
    lifecycleNo: "package.json 里没有 preinstall / install / postinstall 脚本。",
    lifecycleSource:
      "来源：最近一次同步时读到的 GitHub 上的 package.json。prepare 没有记录——它只在从 GitHub 装时执行，被 pnpm 拦下时会出现在「构建脚本」那一行。",
    readmeLabel: "README 里提到",
    readmeTerminal: "shell 命令（bash、exec、spawn 之类）",
    readmeCredentials: "API key、token 或密码",
    readmeNo: "既没提 shell 命令，也没提密钥。",
    readmeSource: "来源：对 README 做的关键词匹配，只提示它可能碰到什么，不是代码分析。",
    notScanned: "还没检查。",
    footer:
      "这不是安全审计。上面是一次实装记录加两次文本扫描，没有人替你读过这个插件的代码。插件带着你 agent 的权限在跑。",
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
    submittedByHand:
      "——从社区帖子人工收录，没有进入 DSH 自带市场的那个精选库。",
    licensed: (l: string) => `开源协议：${l}。`,
    noLicence: "没检测到协议文件。没有协议的代码，默认保留全部权利。",
    overviewHeading: (name: string) => `${name} 是做什么的`,
    readmeHeading: (name: string) => `${name} 的文档`,
    docsNote:
      "根据项目自己的文档整理，会跟着上游更新。两边对不上时以源码仓库为准——",
    docsSource: "去 GitHub 看原始 README",
    relatedEyebrow: "同一分类",
    relatedHeading: (name: string) => `${name} 的同类插件`,
    metaTail: "一行命令装进 DeepSeek Harness，安装命令是沙箱里真装过的。",
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

  top: {
    eyebrow: "排行",
    title: "DeepSeek Harness 插件推荐：看大家实际装了什么",
    lede: "三个榜，各看一种信号：DeepSeek Harness 里实际发生的安装、这一周涨的 Star，以及在大家现在用的版本上、我们 sandbox 实测装得上的插件里谁的 Star 最多。",
    installedHeading: "通过 dshmarketplace 安装最多",
    installedNote:
      "每次有人在 DeepSeek Harness 里从 dshmarketplace 商店装插件就记一次。Star 量的是关注度，这个量的是真用。",
    installedMetric: (n: number) => `${n.toLocaleString("zh")} 次安装`,
    risingHeading: "本周涨得最快",
    risingNote: (from: string, to: string) => `${from} 到 ${to} 两次夜间快照之间新增的 GitHub Star。`,
    risingMetric: (n: number) => `本周 +${n.toLocaleString("zh")} ★`,
    verifiedHeading: (dsh: string) => `在 DeepSeek Harness ${dsh} 上装得上、Star 最多的插件`,
    verifiedNote:
      "每一个都在这个版本的一次性 sandbox 里装上过——或者它的某个旧版装上过，dshmarketplace-cli 会替你挑那一版。",
    verifiedMetric: (n: number) => `★ ${n.toLocaleString("zh")}`,
    empty: "这一榜的数据还不够。",
    rank: (i: number) => `#${i}`,
  },

  weekly: {
    eyebrow: "周报",
    listTitle: "DeepSeek Harness 插件周报",
    listLede:
      "每周一期：目录里新来了什么、谁涨得快、大家在 DeepSeek Harness 里实际装了什么、当前版本又拒装了哪些。每期在生成那晚就定稿，里面的数字是当时量到的。",
    listMetaTitle: "DeepSeek Harness 插件周报：新收录、Star 涨幅与安装排行",
    listMetaDescription:
      "DeepSeek Harness 插件周报：每周新收录的插件、GitHub Star 涨得最多的、在 harness 里实际被装得最多的，以及当前版本拒装的插件。数字全部来自夜间快照和 sandbox 实测。",
    listItem: (total: number, added: number) =>
      `新收录 ${added.toLocaleString("zh")} 个 · 目录共 ${total.toLocaleString("zh")} 个`,
    noIssues: "还没有发过周报。夜间快照攒满一周后出第一期。",
    issueTitle: (from: string, to: string) => `DeepSeek Harness 插件周报 · ${from} → ${to}`,
    issueMetaTitle: (from: string, to: string) => `DeepSeek Harness 插件周报（${from} 至 ${to}）`,
    issueMetaDescription: (from: string, to: string, added: number) =>
      `${from} 到 ${to} 这一周的 DeepSeek Harness 插件：新收录 ${added.toLocaleString("zh")} 个，Star 涨得最多的、被装得最多的，还有当前版本拒装的。`,
    lede: (total: number, added: number) =>
      `目录现有 ${total.toLocaleString("zh")} 个插件，本周新收录 ${added.toLocaleString("zh")} 个。数字都来自夜间快照和 sandbox 实测，不是估的。`,
    frozen: (day: string) => `按 ${day} 的夜间快照定稿，之后不再改：目录还在变，这一页留的是那晚量到的结果。`,
    allIssues: "全部周报",
    releasesHeading: "本周 DeepSeek Harness 发版",
    arrivedHeading: "本周新收录（按 Star）",
    risingHeading: "本周涨 Star 最多",
    installedHeading: "本周在 DeepSeek Harness 里被安装最多",
    compatHeading: (dsh: string) => `DeepSeek Harness ${dsh} 兼容情况`,
    compatBody: (dsh: string, tested: number, refused: number, rescued: number) =>
      `已在 ${dsh} 上实测 ${tested.toLocaleString("zh")} 个，其中 ${refused.toLocaleString("zh")} 个最新版被拒，${rescued.toLocaleString("zh")} 个有能装的旧版。`,
    compatHelp: "装不上先看这里",
    cliLead: "，或者直接",
    cliCommand: "npx dshmarketplace-cli add <插件>",
    cliTail: "，它会按你本机的 dsh 挑版本。",
    starsMetric: (n: number) => `★ ${n.toLocaleString("zh")}`,
    gainedMetric: (n: number) => `+${n.toLocaleString("zh")} ★`,
    installsMetric: (n: number) => `${n.toLocaleString("zh")} 次`,
    noFit: "暂无能装的版本",
    none: "本周没有。",
  },

  refusals: {
    plugin: "插件",
    needs: "最新版要求的 dsh",
    installs: (dsh: string) => `在 ${dsh} 上能装的版本`,
    none: "暂时没有能装的版本",
    empty: "目前在当前 dsh 上还没有被拒的插件。",
  },

  upgrade: {
    metaTitle: (v: string | null) =>
      v
        ? `DeepSeek Harness ${v} 插件兼容性：升级后哪些插件装不上`
        : "DeepSeek Harness 升级前检查：下一版哪些插件装不上",
    metaDescription:
      "把你装的 DeepSeek Harness 插件贴进来，看 next 和 alpha 版会拒装哪些、哪些装不上。每晚在 sandbox 里实装测出来的，不是看 package.json 猜的。",
    eyebrow: "升级前检查",
    title: (v: string | null) =>
      v ? `DeepSeek Harness ${v} 插件兼容性` : "升级 DeepSeek Harness，你的插件还装得上吗",
    lede: "每天夜里，我们把在 npm latest 上装得上的插件，放进 DeepSeek Harness 即将发布的 next 和 alpha 版的干净 profile 里再装一遍。测的只有一件事：在那一版上还能不能装上、注册进 profile；装上之后跑起来行为变没变，不在测量范围内。",
    label: "你装的插件",
    help: "插件名、npm 包名或 github:owner/repo，一行一个或者空格隔开都行。也可以直接把 profile 的 package.json 整个贴进来，会从 dependencies 里读。",
    placeholder: "dsh-better-sidebar\n@liustack/modlens\ngithub:owner/repo",
    check: "检查",
    nothingParsed: "没认出插件名。",
    networkError: "连不上 API，过一会儿再试。",
    overflow: (n: number) => `还有 ${n} 个没查——一次最多 100 个。`,
    skipped: (list: string) => `不像插件名，跳过了：${list}`,
    plugin: "插件",
    now: "现在（latest）",
    notListed: "目录里没有",
    notRun: "还没跑",
    ranOn: (v: string) => `跑的是 ${v}`,
    yours: (tag: string, dsh: string, broken: number, total: number) =>
      `${tag}（${dsh}）：你这 ${total} 个里有 ${broken} 个会装不上。`,
    verdicts: {
      passed: "装得上",
      "needs-approval": "要先批准构建",
      "not-a-layer": "不是 layer",
      failed: "装不上",
      timeout: "超时",
      incompatible: "被拒装",
      untested: "没测过",
    } as Record<string, string>,
    summaryHeading: "sandbox 实测结果",
    tagLine: (tag: string, dsh: string, passed: number, checked: number, date: string) =>
      `${tag}——DeepSeek Harness ${dsh}：在 latest 上装得上的插件抽测了 ${checked} 个，${passed} 个照样装得上。最近一次跑在 ${date}。`,
    tagBreakdown: (refused: number, failed: number, approval: number) =>
      `${refused} 个被版本检查拒装，${failed} 个装失败或超时，${approval} 个要先批准构建脚本。`,
    noRuns: "next 和 alpha 的第一批结果还没出来。每晚每个版本跑 150 个左右，装得多的先跑。",
    regressionsHeading: "latest 上装得上、下一版装不上的",
    regressionsNote: "按 Star 排。每个插件只算它在该 tag 当前版本上最近的一次。",
    regressionsEmpty: "目前没有：抽测到的插件在下一版上都还装得上。",
    stars: "Star",
    fixHeading: "你的插件在名单里怎么办",
    fixBody:
      "被拒装说明插件声明的 dsh 范围没覆盖那一版，只有作者放宽 engines.dsh 才能解决。在那之前，先别升级 DeepSeek Harness 就行。",
    fixLink: "DeepSeek Harness 为什么拒装插件，以及所有绕过办法 ›",
    api: "同样的数据有 JSON 接口，开放 CORS，每次最多 100 个：",
    fromInstallFailed: "准备升级 DeepSeek Harness？先查查你的插件在下一版上还装不装得上 ›",
  },

  market: {
    title: "dshmarketplace 实测可装",
    description:
      "这里每一版都先在一次性 sandbox 的干净 DeepSeek Harness profile 里实装过才列出来，并标明它接受哪些 dsh 版本。",
    labelRegistry: "社区精选库收录",
    labelLinuxdo: "作者在 LINUX DO 认证过",
    labelOlderRelease: "旧版——最新版要更新的 dsh",
    sortStars: "GitHub Star",
    sortInstalls: "经 dshmarketplace 安装次数",
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
