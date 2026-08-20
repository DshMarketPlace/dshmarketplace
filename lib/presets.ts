/**
 * Curated plugin sets, and the evidence that each one works.
 *
 * A preset puts our name on other people's work, so the bar is higher than for
 * a listing. A listing says "this plugin installed on its own"; a preset says
 * "these install *together*", which is a different claim and fails in ways the
 * parts do not — incompatible peers, a build script blocked only once another
 * plugin drags in its owner, or cordis refusing a duplicate loader entry id so
 * a plugin installs and is silently never registered.
 *
 * Every preset therefore carries `verified`: the date the whole set was run
 * through `preset.mjs` in the sandbox with the exact command published here,
 * and the verdict it came back with. `scripts/verify-presets.ts` re-runs them
 * and rewrites those fields. A preset with no verification does not ship —
 * there is no field for "we think this is fine".
 */

export type PresetVerdict = "passed" | "needs-approval";

export type Preset = {
  id: string;
  name: { en: string; zh: string };
  /** One line, in the reader's language, about who this is for. */
  blurb: { en: string; zh: string };
  /** Install targets, exactly as they go into `dsh plugin add a b c`. */
  plugins: string[];
  verified: {
    /** ISO date the whole combination last passed in the sandbox. */
    at: string;
    verdict: PresetVerdict;
    /**
     * Packages whose build scripts pnpm refused to run. Not a defect — one
     * `onlyBuiltDependencies` entry each, which the CLI writes automatically —
     * but a reader installing by hand needs to be told, so it is published
     * rather than hidden behind a green tick.
     */
    blockedBuilds: string[];
    /** The dsh version the sandbox image carried for that run. */
    dsh: string;
    /** Pinned, because the same plugin can pass on 10 and not on 11. */
    pnpm: string;
  };
};

export const PRESETS: Preset[] = [
  {
    id: "essentials",
    name: { en: "Essentials", zh: "日常必备" },
    blurb: {
      en: "Memory that survives a restart, search that reads the repo, an undo for the last turn, and a running token count.",
      zh: "重启不丢的记忆、能读仓库的搜索、上一轮的后悔药，外加一个一直在数的 token 计数。",
    },
    plugins: [
      "dsh-context",
      "dsh-mnemon",
      "@liustack/modsearch",
      "@anionex/dsh-turn-rewind",
      "dsh-tokenledger",
    ],
    verified: {
      at: "2026-08-20",
      verdict: "passed",
      blockedBuilds: [],
      dsh: "0.1.0-rc.7",
      pnpm: "10.34.5",
    },
  },
  {
    id: "vision",
    name: { en: "Vision", zh: "视觉套装" },
    blurb: {
      en: "Three plugins that all want to handle images, verified as not fighting each other over it.",
      zh: "三个都想接管图像的插件，实测过它们不会为此打架。",
    },
    plugins: [
      "@liustack/modlens",
      "dsh-vision-router",
      "@anionex/dsh-vision-toolkit",
    ],
    verified: {
      at: "2026-08-20",
      verdict: "passed",
      blockedBuilds: [],
      dsh: "0.1.0-rc.7",
      pnpm: "10.34.5",
    },
  },
  {
    id: "power",
    name: { en: "Heavy use", zh: "重度使用" },
    blurb: {
      en: "The four highest-starred things that still install cleanly together — a better sidebar, agent teams, vision and memory.",
      zh: "还能干净地装在一起的四个高 star 项：更好用的侧栏、agent 团队、视觉、记忆。",
    },
    plugins: [
      "@liustack/modlens",
      "dsh-better-sidebar",
      "@nanmicoder/dsh-agent-teams",
      "dsh-context",
    ],
    verified: {
      at: "2026-08-20",
      verdict: "passed",
      blockedBuilds: ["node-pty@1.1.0"],
      dsh: "0.1.0-rc.7",
      pnpm: "10.34.5",
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/**
 * The command a reader copies. Written against `web` because that is what a
 * default install creates; `dshmarketplace-cli` reads the real profile off
 * disk instead of assuming, which is the reason to prefer it over the paste.
 */
export function presetCommand(preset: Preset, profile = "web"): string {
  return `dsh plugin --profile ${profile} add ${preset.plugins.join(" ")}`;
}

export function presetCliCommand(preset: Preset): string {
  return `npx dshmarketplace-cli preset ${preset.id}`;
}

/**
 * A preset joined to the live catalogue rows for its members.
 *
 * Shared by the API route and both locale pages so that a preset cannot say
 * one thing in a browser and another over HTTP — the failure this project
 * keeps hitting is two surfaces disagreeing about the same listing.
 */
export async function getPresetsWithPlugins() {
  const { getPluginsByNpmName } = await import("@/lib/data");
  const wanted = [...new Set(PRESETS.flatMap((p) => p.plugins))];
  const rows = await getPluginsByNpmName(wanted);
  const byNpm = new Map(
    rows.filter((r) => r.npmPackage).map((r) => [r.npmPackage as string, r]),
  );

  return {
    unresolved: wanted.filter((w) => !byNpm.has(w)),
    presets: PRESETS.map((preset) => ({
      ...preset,
      members: preset.plugins.map((target) => ({
        target,
        plugin: byNpm.get(target) ?? null,
      })),
    })),
  };
}
