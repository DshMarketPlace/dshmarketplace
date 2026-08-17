import { eq, or } from "drizzle-orm";

import { db } from "@/db/client";
import { plugins } from "@/db/schema";

export type InspectResult =
  | { ok: true; repo: RepoPreview }
  | { ok: false; error: string };

export type RepoPreview = {
  fullName: string;
  owner: string;
  repo: string;
  url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  license: string | null;
  stars: number;
  pushedAt: string | null;
  topics: string[];
  hasDshTopic: boolean;
  alreadyListed: boolean;
  listedSlug: string | null;
};

/**
 * Accepts the canonical repository URL and nothing else. Deliberately strict:
 * a submission is a claim about a specific repository, and `owner/repo` with a
 * path, a query string or a `.git` suffix attached is a different claim that
 * only looks the same.
 */
export function parseRepoUrl(
  input: string,
): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 300) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!/^[\w.-]{1,100}$/.test(owner) || !/^[\w.-]{1,100}$/.test(repo)) {
    return null;
  }

  return { owner, repo };
}

/**
 * Reads a bounded set of public fields. Nothing here is trusted enough to
 * publish on its own — a submission still lands as `pending` for review — but
 * checking it up front means an author finds out about an archived repository
 * or a missing licence immediately rather than in a week of silence.
 */
export async function inspectRepo(input: string): Promise<InspectResult> {
  const parsed = parseRepoUrl(input);
  if (!parsed) {
    return {
      ok: false,
      error:
        "That does not look like a GitHub repository URL. Use the repository root, for example https://github.com/owner/dsh-plugin.",
    };
  }

  const { owner, repo } = parsed;
  const token = process.env.GITHUB_TOKEN;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "dshmarketplace.dev",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // The listing is reviewed by hand anyway; a minute-old copy is fine and
    // keeps a burst of submissions from spending the rate limit.
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return {
      ok: false,
      error:
        "No public repository at that URL. Private and deleted repositories cannot be listed.",
    };
  }
  if (res.status === 403 || res.status === 429) {
    return {
      ok: false,
      error: "GitHub is rate-limiting this check. Try again in a few minutes.",
    };
  }
  if (!res.ok) {
    return { ok: false, error: `GitHub returned ${res.status}.` };
  }

  const r = (await res.json()) as Record<string, never> & {
    full_name: string;
    description: string | null;
    homepage: string | null;
    language: string | null;
    license: { spdx_id?: string } | null;
    stargazers_count: number;
    pushed_at: string | null;
    topics?: string[];
    archived: boolean;
    disabled: boolean;
    fork: boolean;
  };

  if (r.archived) {
    return { ok: false, error: "That repository is archived." };
  }
  if (r.disabled) {
    return { ok: false, error: "That repository is disabled." };
  }

  const fullName = `${owner}/${repo}`;
  const existing = await db
    .select({ slug: plugins.slug, visibility: plugins.visibility })
    .from(plugins)
    .where(
      or(
        eq(plugins.fullName, fullName),
        eq(plugins.repoUrl, `https://github.com/${fullName}`),
      ),
    )
    .limit(1);

  const topics = r.topics ?? [];

  return {
    ok: true,
    repo: {
      fullName,
      owner,
      repo,
      url: `https://github.com/${fullName}`,
      description: r.description,
      homepage: r.homepage || null,
      language: r.language,
      license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION"
        ? r.license.spdx_id
        : null,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      topics,
      hasDshTopic: topics.includes("dsh-plugin"),
      alreadyListed: existing.length > 0,
      listedSlug:
        existing[0] && existing[0].visibility !== "hidden"
          ? existing[0].slug
          : null,
    },
  };
}
