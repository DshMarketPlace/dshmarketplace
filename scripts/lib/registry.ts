import yaml from "js-yaml";
import { correctedSummary } from "./summary-corrections";

export const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  agi: { en: "Agents & AGI", zh: "智能体与 AGI" },
  ui: { en: "UI Enhancements", zh: "UI 增强" },
  tools: { en: "Tools & Capabilities", zh: "工具与能力" },
  dev: { en: "Development & Runtime", zh: "开发与运行时" },
  notify: { en: "Notifications & Integrations", zh: "通知与集成" },
  session: { en: "Sessions & Messages", zh: "会话与消息" },
  workflow: { en: "Workflow & Automation", zh: "工作流与自动化" },
  usage: { en: "Usage & Billing", zh: "用量与计费" },
  memory: { en: "Memory", zh: "记忆" },
  skill: { en: "Skills", zh: "技能包" },
  vision: { en: "Vision & Multimodal", zh: "视觉与多模态" },
  theme: { en: "Themes & Appearance", zh: "主题与外观" },
  fun: { en: "Just for Fun", zh: "娱乐" },
  model: { en: "Models & Providers", zh: "模型与账号接入" },
  identity: { en: "Identity & Profiles", zh: "身份与配置" },
  wsl: { en: "WSL & Windows", zh: "WSL 与 Windows" },
  browser: { en: "Browser & Web", zh: "浏览器与网页" },
  voice: { en: "Voice & Audio", zh: "语音与音频" },
  docs: { en: "Documentation & Writing", zh: "文档与写作" },
  git: { en: "Git & Version Control", zh: "Git 与版本控制" },
  security: { en: "Security & Permissions", zh: "安全与权限" },
  remote: { en: "Remote Access", zh: "远程访问" },
  market: { en: "Plugin Markets & Managers", zh: "插件市场与管理" },
};

export const CATEGORY_ORDER = [
  "agi",
  "ui",
  "usage",
  "theme",
  "model",
  "identity",
  "session",
  "memory",
  "tools",
  "wsl",
  "browser",
  "vision",
  "voice",
  "docs",
  "skill",
  "workflow",
  "git",
  "notify",
  "dev",
  "security",
  "remote",
  "market",
  "fun",
];

type RegistryDescription = { en?: string; zh?: string } | string;

type RegistryEntry = {
  url?: unknown;
  name?: unknown;
  category?: unknown;
  description?: unknown;
};

export type RegistryPlugin = {
  fullName: string;
  owner: string;
  repo: string;
  subpath: string | null;
  slug: string;
  name: string;
  repoUrl: string;
  summary: string | null;
  summaryZh: string | null;
  categoryId: string | null;
};

const GENERIC_LEAF = new Set([
  "dsh",
  "plugin",
  "plugins",
  "src",
  "main",
  "index",
  "app",
  "core",
  "lib",
  "packages",
  "dist",
  "server",
  "client",
]);

export function displayName(repo: string, subpath: string | null) {
  if (!subpath) return repo;
  const leaf = subpath.split("/").pop() ?? "";
  return !leaf || GENERIC_LEAF.has(leaf.toLowerCase()) ? repo : leaf;
}

export function slugify(fullName: string) {
  const [repository, subpath] = fullName.split("#", 2);
  const repositorySlug = repository
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!subpath) return repositorySlug;

  const subpathSlug = subpath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return repositorySlug + "--" + subpathSlug;
}

function descOf(
  description: RegistryDescription | undefined,
  lang: "en" | "zh",
) {
  if (!description) return null;
  if (typeof description === "string") {
    return lang === "en" ? description.trim() || null : null;
  }
  const value = description[lang];
  return typeof value === "string" ? value.trim() || null : null;
}

/**
 * One parser for both the initial seed and recurring reconciliation. Registry
 * YAML is untrusted input, so every field is checked after parsing and no
 * value is allowed to become a database identity through string coercion.
 */
export function parseRegistryEntry(raw: string): RegistryPlugin | null {
  const loaded = yaml.load(raw);
  if (!loaded || typeof loaded !== "object" || Array.isArray(loaded))
    return null;

  const entry = loaded as RegistryEntry;
  if (typeof entry.url !== "string" || typeof entry.name !== "string") {
    return null;
  }

  const hashAt = entry.name.indexOf("#");
  const namePath = hashAt === -1 ? entry.name : entry.name.slice(0, hashAt);
  const explicitSubpath =
    hashAt === -1 ? null : entry.name.slice(hashAt + 1).trim() || null;

  const match = entry.url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  const owner = (match?.[1] ?? namePath.split("/")[0] ?? "").trim();
  const repo = (match?.[2] ?? namePath.split("/")[1] ?? "")
    .replace(/\.git$/i, "")
    .trim();
  if (!owner || !repo) return null;

  // Most monorepo entries carry #subpath in `name`. A small but valid subset
  // only links a GitHub tree, so use its path as a fallback to avoid merging
  // that plugin into the repository's root listing.
  const treeMatch = entry.url.match(
    /github\.com\/[^/]+\/[^/#?]+\/tree\/[^/]+\/(.+?)(?:[?#]|$)/i,
  );
  const treeSubpath = treeMatch?.[1]?.replace(/^\/+|\/+$/g, "") || null;
  const subpath = explicitSubpath ?? treeSubpath;

  const fullName = subpath
    ? owner + "/" + repo + "#" + subpath
    : owner + "/" + repo;
  const description =
    typeof entry.description === "string" ||
    (entry.description !== null &&
      typeof entry.description === "object" &&
      !Array.isArray(entry.description))
      ? (entry.description as RegistryDescription)
      : undefined;
  const categoryId =
    typeof entry.category === "string" && CATEGORY_LABELS[entry.category]
      ? entry.category
      : null;

  return {
    fullName,
    owner,
    repo,
    subpath,
    slug: slugify(fullName),
    name:
      hashAt === -1 && !entry.name.includes("/")
        ? entry.name.trim()
        : displayName(repo, explicitSubpath ?? subpath),
    repoUrl: "https://github.com/" + owner + "/" + repo,
    summary: descOf(description, "en"),
    summaryZh: descOf(description, "zh"),
    ...correctedSummary(fullName),
    categoryId,
  };
}
