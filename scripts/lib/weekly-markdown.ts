/**
 * A stored weekly issue as a post for the places the ecosystem gathers
 * (LINUX DO, the harness's own Discussions). The words live here and in
 * `lib/dict.ts`; the issue itself carries only measurements.
 */
import type { WeeklyData, WeeklyRow } from "../../lib/weekly";

const SITE = "https://dshmarketplace.dev";

const link = (p: WeeklyRow) => (p.visibility === "hidden" ? p.repoUrl : `${SITE}/plugins/${p.slug}`);

export function renderWeeklyMarkdown(w: WeeklyData, lang: "zh" | "en"): string {
  const zh = lang === "zh";
  const n = (v: number) => v.toLocaleString();
  const say = (p: WeeklyRow) => (zh ? (p.summaryZh ?? p.summary) : p.summary) ?? "";
  const list = (rows: WeeklyRow[], unit: (v: number) => string) =>
    rows.length
      ? rows
          .map((p, i) => `${i + 1}. [${p.fullName}](${link(p)}) — ${unit(p.metric)}${say(p) ? `\n   ${say(p)}` : ""}`)
          .join("\n")
      : zh
        ? "（本周没有）"
        : "(none this week)";

  const out: string[] = [];
  out.push(
    zh
      ? `# DeepSeek Harness 插件周报 · ${w.from} → ${w.day}`
      : `# DeepSeek Harness plugins this week · ${w.from} → ${w.day}`,
    "",
    zh
      ? `目录现有 ${n(w.totals.total)} 个插件，本周新收录 ${n(w.totals.added)} 个。数字都来自 ${SITE} 的夜间快照和 sandbox 实测，不是估的。`
      : `${n(w.totals.total)} plugins in the catalogue, ${n(w.totals.added)} added this week. Every number comes from the nightly snapshots and sandbox runs at ${SITE}.`,
    "",
  );
  if (w.releases.length) {
    out.push(zh ? "## 本周 DeepSeek Harness 发版" : "## DeepSeek Harness releases this week", "");
    for (const r of w.releases) out.push(`- \`${r.version}\` · ${r.day}${r.tag ? ` · npm \`${r.tag}\`` : ""}`);
    out.push("");
  }
  out.push(zh ? "## 本周新收录（按 Star）" : "## New this week, by stars", "", list(w.arrived, (v) => `★ ${v}`), "");
  out.push(zh ? "## 本周涨 Star 最多" : "## Most stars gained", "", list(w.rising, (v) => `+${v} ★`), "");
  out.push(
    zh ? "## 本周在 DeepSeek Harness 里被安装最多" : "## Most installed from inside DeepSeek Harness",
    "",
    list(w.installed, (v) => (zh ? `${v} 次` : `${v} installs`)),
    "",
  );
  const c = w.compat;
  if (c) {
    out.push(
      zh ? `## DeepSeek Harness ${c.dsh} 兼容情况` : `## Compatibility with DeepSeek Harness ${c.dsh}`,
      "",
      zh
        ? `已在 ${c.dsh} 上实测 ${n(c.tested)} 个，其中 ${n(c.refused)} 个最新版被拒，${n(c.rescued)} 个有能装的旧版。装不上先看 ${SITE}/zh/install-failed ，或者直接 \`npx dshmarketplace-cli add <插件>\`，它会按你本机的 dsh 挑版本。`
        : `${n(c.tested)} plugins run on ${c.dsh}: ${n(c.refused)} had their latest release refused, ${n(c.rescued)} of those have an older release that installs. If one will not install, see ${SITE}/install-failed — or run \`npx dshmarketplace-cli add <plugin>\`, which picks a release your dsh accepts.`,
      "",
    );
    for (const p of w.refused) {
      const f = p.fallback;
      const fix =
        f?.status === "passed" && p.npm && f.version
          ? `\`${p.npm}@${f.version}\``
          : zh
            ? "暂无能装的版本"
            : "no release fits yet";
      out.push(`- [${p.fullName}](${link(p)}) → ${fix}`);
    }
    out.push("");
  }
  return out.join("\n") + "\n";
}
