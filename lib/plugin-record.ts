import type { PluginCardRow } from "@/lib/data";
import { primaryInstall, installOptions, isInstallable } from "@/lib/install";
import { directory } from "@/directory.config";

/**
 * One plugin as every machine-facing surface describes it — the JSON API and
 * the MCP server alike, so an agent and a script can never be told two
 * different things about the same listing.
 */
export function pluginRecord(p: PluginCardRow) {
  return {
    fullName: p.fullName,
    name: p.name,
    owner: p.owner,
    repo: p.repo,
    subpath: p.subpath,
    summary: p.summary,
    summaryZh: p.summaryZh,
    category: p.categoryId,
    language: p.language,
    license: p.license,
    stars: p.stars,
    pushedAt: p.repoPushedAt,
    repoUrl: p.repoUrl,
    npmPackage: p.npmPackage,
    installKind: p.installKind,
    // null rather than a placeholder: a caller that runs whatever is in this
    // field must not be handed something that does not install the plugin.
    install: primaryInstall(p)?.cmd ?? null,
    installable: isInstallable(p),
    installOptions: installOptions(p),
    // What happened when the command above was actually run, in a throwaway
    // container against a clean profile: passed | needs-approval | not-a-layer
    // | failed | timeout | incompatible, or null where it has not been run
    // since the command last changed. Only failed and timeout are defects;
    // `incompatible` means the harness refused the latest release for its dsh
    // range — see installFallback for a release it accepts. `needs-approval` means pnpm
    // blocked a build script until it is allowlisted, which one `allowBuilds`
    // entry fixes; `not-a-layer` means the package installed but declares no
    // `dsh.bundle`, so the harness took it as an ordinary dependency.
    installCheck: p.installStatus,
    installCheckedAt: p.installCheckedAt,
    // The dsh the verdict was produced on; null for verdicts from before
    // 18 Oct 2026, which were all dsh 0.1.
    installCheckDsh: p.installDshVersion,
    // On `incompatible`: the newest release that dsh accepts and what
    // happened when it was installed, `{ version, status }`; version null
    // when no release fits. `npx dshmarketplace-cli add` picks it itself.
    installFallback: p.installFallback ? JSON.parse(p.installFallback) : null,
    // The packages pnpm named when it refused to run their build scripts —
    // observed in the sandbox, not inferred from the README. This is the whole
    // content of a `needs-approval` verdict, and without it a client can say
    // that something needs approving but not what, which is the difference
    // between a warning and a fix.
    blockedBuilds: p.blockedBuilds ? JSON.parse(p.blockedBuilds) : [],
    riskFlags: p.riskFlags ? JSON.parse(p.riskFlags) : [],
    inRegistry: p.inRegistry,
    // Only promoted plugins have a page worth linking to.
    url:
      p.visibility === "hidden"
        ? p.repoUrl
        : `${directory.baseUrl}/plugins/${p.slug}`,
  };
}
