/**
 * Turns whatever a reader pastes into the upgrade check — plugin names, npm
 * names, `github:owner/repo`, a whole `dsh plugin add` line, or the profile's
 * `package.json` — into catalogue keys the compat API can look up.
 *
 * Shared by the textarea (client) and `/api/v1/compat` (server), so the two
 * can never disagree about what a name means. No imports on purpose: it ships
 * to the browser.
 */

export type CompatKey =
  /** An npm package name, the way a profile's `package.json` keys it. */
  | { kind: "npm"; key: string }
  /** A catalogue `full_name`: `owner/repo`, or `owner/repo#subpath`. */
  | { kind: "repo"; key: string };

export type ParsedNames = {
  keys: CompatKey[];
  invalid: string[];
  /** Valid names past the cap, dropped rather than silently looked up. */
  overflow: number;
};

export const MAX_NAMES = 100;

// npm's own rules: lowercase, 214 characters, an optional scope.
const NPM = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
// GitHub's: an owner of up to 39, a repository of up to 100, and our subpath.
const OWNER = "[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})";
const REPO = "[A-Za-z0-9._-]{1,100}";
const FULL_NAME = new RegExp(`^${OWNER}/${REPO}(?:#[A-Za-z0-9._/-]{1,200})?$`);
const GITHUB_URL = new RegExp(`^(?:git\\+)?https?://(?:www\\.)?github\\.com/(${OWNER})/(${REPO}?)(?:\\.git)?(?:[/#?].*)?$`);
const GITHUB_SPEC = new RegExp(`^github:(${OWNER})/(${REPO}?)(?:\\.git)?(?:#(.*))?$`);

// The words of a pasted `dsh plugin --profile web add a b` line, and of the
// CLI's own. A plugin is never called `add`, so dropping these costs nothing.
const COMMAND_WORDS = new Set(["dsh", "plugin", "add", "install", "npx", "dshmarketplace-cli", "pnpm"]);
const FLAGS_WITH_VALUE = new Set(["--profile", "-p"]);

// The harness's own packages sit in every profile's `package.json`. They are
// not plugins, and listing them as "not in the catalogue" reads like a fault.
const HOST_PACKAGE = /^@deepseek-ai\/dsh(?:-|$)/;

function trimVersion(name: string): string {
  // `name@1.2.3` and `@scope/name@^1` → the name; a scope's own `@` stays.
  const at = name.lastIndexOf("@");
  return at > 0 ? name.slice(0, at) : name;
}

/** `path:sub` or `path:/sub` in a pnpm fragment; anything else is a ref. */
function subpathOf(fragment: string | undefined): string | null {
  if (!fragment) return null;
  for (const part of fragment.split("&")) {
    for (const piece of part.split("::")) {
      const m = /^path:\/?(.+?)\/?$/.exec(piece);
      if (m) return m[1];
    }
  }
  return null;
}

function repoKey(owner: string, repo: string, sub: string | null): string {
  const base = `${owner}/${repo.replace(/\.git$/, "")}`;
  return sub ? `${base}#${sub}` : base;
}

/** One token → a key, or null when it is not a name we could look up. */
export function parseName(raw: string): CompatKey | null {
  const token = raw.trim().replace(/^["'`]+|["'`,;]+$/g, "");
  if (!token || token.length > 300) return null;

  const spec = GITHUB_SPEC.exec(token);
  if (spec) return { kind: "repo", key: repoKey(spec[1], spec[2], subpathOf(spec[3])) };

  const url = GITHUB_URL.exec(token);
  if (url) return { kind: "repo", key: repoKey(url[1], url[2], null) };

  if (token.startsWith("@") || !token.includes("/")) {
    const name = trimVersion(token).toLowerCase();
    return name.length <= 214 && NPM.test(name) ? { kind: "npm", key: name } : null;
  }

  return FULL_NAME.test(token) ? { kind: "repo", key: token } : null;
}

/** A `package.json` dependency: the spec decides, the key is the fallback. */
function fromDependency(name: string, spec: unknown): CompatKey | null {
  if (typeof spec === "string" && /^(github:|git\+https?:|https?:\/\/github\.com\/)/.test(spec)) {
    return parseName(spec);
  }
  return parseName(name);
}

const DEPENDENCY_FIELDS = ["dependencies", "optionalDependencies", "devDependencies"] as const;

function fromPackageJson(text: string): string[] | null {
  let manifest: unknown;
  try {
    manifest = JSON.parse(text);
  } catch {
    return null;
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return null;
  const out: string[] = [];
  for (const field of DEPENDENCY_FIELDS) {
    const deps = (manifest as Record<string, unknown>)[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, spec] of Object.entries(deps as Record<string, unknown>)) {
      if (HOST_PACKAGE.test(name)) continue;
      const key = fromDependency(name, spec);
      out.push(key ? encodeKey(key) : name);
    }
  }
  return out;
}

function fromText(text: string): string[] {
  const out: string[] = [];
  const tokens = text.split(/[\s,]+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (FLAGS_WITH_VALUE.has(token)) {
      i++;
      continue;
    }
    if (token.startsWith("-") || COMMAND_WORDS.has(token) || token === "$") continue;
    out.push(token);
  }
  return out;
}

/** What the API's `names` parameter carries for a key. */
export function encodeKey(key: CompatKey): string {
  return key.key;
}

/**
 * Everything the reader pasted → deduplicated keys, the tokens that were not
 * names, and how many valid ones fell past {@link MAX_NAMES}.
 */
export function parseNames(input: string, max = MAX_NAMES): ParsedNames {
  const text = input.trim();
  const tokens = (text.startsWith("{") ? fromPackageJson(text) : null) ?? fromText(text);

  const seen = new Set<string>();
  const keys: CompatKey[] = [];
  const invalid: string[] = [];
  let overflow = 0;

  for (const token of tokens) {
    const key = parseName(token);
    if (!key) {
      if (invalid.length < 20) invalid.push(token.slice(0, 80));
      continue;
    }
    if (key.kind === "npm" && HOST_PACKAGE.test(key.key)) continue;
    const id = `${key.kind}:${key.key}`;
    if (seen.has(id)) continue;
    seen.add(id);
    if (keys.length >= max) {
      overflow++;
      continue;
    }
    keys.push(key);
  }
  return { keys, invalid, overflow };
}
