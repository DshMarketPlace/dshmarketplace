import Link from "next/link";

import { CopyCommand } from "@/components/copy-command";
import { presetCommand, presetCliCommand, type Preset } from "@/lib/presets";
import type { PluginCardRow } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

type Member = { target: string; plugin: PluginCardRow | null };

const COPY = {
  en: {
    verified: "Installed together and verified",
    on: "on",
    contains: (n: number) => `${n} plugin${n === 1 ? "" : "s"}`,
    recommended: "Recommended",
    recommendedWhy:
      "reads your real profile name, drops anything the sandbox could not install, and allowlists a blocked build script for you",
    manual: "Or paste it yourself",
    blocked: "Needs one build script approved:",
    blockedWhy:
      "pnpm will not run it until it is allowlisted, and until then the harness may never register the plugin. The command above does it for you.",
    notListed: "not in the catalogue",
  },
  zh: {
    verified: "整套一起装过，实测通过",
    on: "环境",
    contains: (n: number) => `${n} 个插件`,
    recommended: "推荐",
    recommendedWhy:
      "会读你真实的 profile 名、把沙箱装不上的先剔掉、被拦下的 build script 自动放行",
    manual: "或者自己粘这条",
    blocked: "有一个 build script 需要放行：",
    blockedWhy:
      "在放行之前 pnpm 不会执行它，harness 也可能一直不注册这个插件。上面那条命令会替你做掉。",
    notListed: "目录里没有",
  },
} as const;

export function PresetCard({
  preset,
  members,
  locale = "en",
}: {
  preset: Preset;
  members: Member[];
  locale?: Locale;
}) {
  const d = COPY[locale];
  const v = preset.verified;

  return (
    <article className="border border-border">
      <header className="border-b border-border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="m-0 text-xl font-semibold">{preset.name[locale]}</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {d.contains(preset.plugins.length)}
          </span>
        </div>
        <p className="mt-2 mb-0 text-sm text-muted-foreground">
          {preset.blurb[locale]}
        </p>
      </header>

      <ul className="m-0 grid list-none gap-px bg-border p-0 sm:grid-cols-2">
        {members.map(({ target, plugin }) => (
          <li key={target} className="bg-background p-4">
            <div className="font-mono text-xs break-all">{target}</div>
            <p className="mt-1 mb-0 text-xs text-muted-foreground">
              {plugin
                ? ((locale === "zh" ? plugin.summaryZh : plugin.summary) ??
                  plugin.summary ??
                  "")
                : d.notListed}
            </p>
            {plugin && plugin.visibility !== "hidden" ? (
              <Link
                href={locale === "zh" ? `/zh/plugins/${plugin.slug}` : `/plugins/${plugin.slug}`}
                className="mt-1 inline-block text-xs underline underline-offset-2"
              >
                {plugin.fullName}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-5">
        {/* The evidence, before the command rather than after it. A preset is
            only worth more than a list of names because the combination was
            actually run, so that fact is the headline, not a footnote. */}
        <p className="mt-0 mb-3 font-mono text-xs text-muted-foreground">
          {d.verified} · {v.at} · {d.on} dsh {v.dsh} / pnpm {v.pnpm}
        </p>

        <p className="mt-0 mb-1 text-xs font-semibold">{d.recommended}</p>
        <CopyCommand command={presetCliCommand(preset)} locale={locale} />
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          {d.recommendedWhy}
        </p>

        <p className="mt-0 mb-1 text-xs font-semibold">{d.manual}</p>
        <CopyCommand command={presetCommand(preset)} locale={locale} />

        {v.blockedBuilds.length ? (
          <p className="mt-3 mb-0 text-xs text-muted-foreground">
            <strong>{d.blocked}</strong>{" "}
            <code>{v.blockedBuilds.join(", ")}</code> — {d.blockedWhy}
          </p>
        ) : null}
      </div>
    </article>
  );
}
