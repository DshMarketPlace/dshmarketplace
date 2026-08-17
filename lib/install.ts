import type { Plugin } from "@/db/schema";
import { t } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

export type InstallOption = {
  label: string;
  cmd: string;
  note?: string;
};

type InstallFields = Pick<
  Plugin,
  "owner" | "repo" | "subpath" | "npmPackage" | "installKind"
>;

/**
 * The profile every command is written against.
 *
 * `dsh plugin` is a thin forward to pnpm inside a profile directory, so
 * `--profile` is mandatory — `dsh plugin add x` exits with "required option
 * '--profile <name>' not specified" and nothing installs. `web` is the profile
 * a default install creates; the note tells anyone on another one to swap it.
 */
const PROFILE = "web";

/**
 * Resolves how a plugin is actually installed into DeepSeek Harness.
 *
 * npm is offered first when the plugin publishes there — DSH resolves a
 * tarball instead of cloning the whole repository, and, more importantly, pnpm
 * blocks a git-hosted package's build script until it is allowlisted, so the
 * npm route is the one that works without extra steps. The GitHub form always
 * exists as a fallback, and carries the `#subpath` suffix for repositories
 * that ship more than one plugin.
 *
 * The commands themselves never localise. Only the prose around them does.
 */
export function installOptions(
  plugin: InstallFields,
  locale: Locale = "en",
): InstallOption[] {
  const d = t(locale).install;
  const options: InstallOption[] = [];

  if (plugin.npmPackage) {
    options.push({
      label: "npm",
      cmd: `dsh plugin --profile ${PROFILE} add ${plugin.npmPackage}`,
      note: d.npmNote,
    });
  }

  // A monorepo subpath cannot be installed this way at all. `dsh plugin add`
  // forwards to pnpm, and pnpm reads everything after `#` as a git ref, so
  // `github:owner/repo#packages/thing` fails with "Could not resolve
  // packages/thing to a commit". Publishing a broken command would be worse
  // than publishing none, so those listings get an explanation instead.
  // No fallback command is offered. A `git clone` here would be worse than
  // nothing: it reads as an install command, an agent following the API would
  // run it, and afterwards no plugin is installed.
  if (plugin.subpath) return options;

  options.push({
    label: "GitHub",
    cmd: `dsh plugin --profile ${PROFILE} add github:${plugin.owner}/${plugin.repo}`,
    note: d.githubNote,
  });

  return options;
}

/** The one-liner shown on cards — whichever route is fastest, if any exists. */
export function primaryInstall(
  plugin: InstallFields,
  locale: Locale = "en",
): InstallOption | undefined {
  return installOptions(plugin, locale)[0];
}

/**
 * False for a plugin in a subdirectory of a larger repository that publishes
 * no npm package: `dsh plugin add` genuinely cannot reach it.
 */
export function isInstallable(plugin: InstallFields) {
  return Boolean(plugin.npmPackage) || !plugin.subpath;
}

export function installKindLabel(kind: string, locale: Locale = "en") {
  const d = t(locale).install;
  switch (kind) {
    case "npm":
      return d.kindNpm;
    case "bundle":
      return d.kindBundle;
    case "skill":
      return d.kindSkill;
    case "github":
    default:
      return d.kindGithub;
  }
}
