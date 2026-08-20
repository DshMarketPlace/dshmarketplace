import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { PresetCard } from "@/components/preset-card";
import { getPresetsWithPlugins } from "@/lib/presets";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness Plugin Presets — Verified Sets | DSH Marketplace",
  description:
    "Curated DeepSeek Harness plugin sets, each installed together in a sandbox before it was published. One command sets up memory, search, vision or a full workspace.",
  alternates: alternatesFor("en", "/presets"),
};

export default async function PresetsPage() {
  const { presets, unresolved } = await getPresetsWithPlugins();

  return (
    <PageShell
      wide
      eyebrow="Presets"
      title="Sets that were installed together"
      lede="A working DeepSeek Harness setup in one command. Every set below was installed into a clean profile as a single install, and every plugin in it was confirmed to register — not checked one at a time and assumed to get along."
    >
      <h2>Why a set is a different claim</h2>
      <p>
        Each listing in this catalogue carries a verdict from installing{" "}
        <em>that plugin</em> into an empty profile. That is the right test for a
        listing and the wrong one for a set, because combinations fail where the
        parts do not:
      </p>
      <ul>
        <li>two plugins wanting incompatible versions of the same peer</li>
        <li>
          a build script pnpm only blocks once another plugin has dragged in the
          dependency that owns it
        </li>
        <li>
          cordis refusing a duplicate loader entry id — so a plugin installs,
          reports success, and is never registered
        </li>
      </ul>
      <p>
        So each set here was run through the sandbox as{" "}
        <strong>one install of the whole list</strong>, using the exact command
        printed beside it, and every member had to appear in the profile&apos;s
        bundle list afterwards. Anything less does not ship. A set that quietly
        drops a plugin is worse than no set at all: you would believe you had a
        capability you do not have.
      </p>
      <p>
        The sandbox is{" "}
        <a href="https://github.com/DshMarketPlace/dsh-plugin-validator">
          open source
        </a>
        , as is{" "}
        <a href="https://github.com/DshMarketPlace/dshmarketplace-cli">
          the CLI
        </a>
        . The dates and versions below are what the run actually reported.
      </p>

      <div className="not-prose my-10 grid gap-8">
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            members={preset.members}
            locale="en"
          />
        ))}
      </div>

      <h2>These will grow</h2>
      <p>
        Three to start, and more as combinations are verified — the constraint
        is sandbox time, not ideas. If a set you want does not exist, or one of
        these is missing something obvious,{" "}
        <Link href="/contact">say so</Link> and it can be tested.
      </p>
      <p>
        Building your own instead? <code>GET /api/v1/presets</code> serves all
        of this as JSON, including the verification metadata, and{" "}
        <Link href="/api-docs">the API is open</Link> — no key, CORS included.
      </p>
      {unresolved.length ? (
        <p>
          <strong>Note:</strong> {unresolved.join(", ")} — named by a set but
          not currently resolvable in the catalogue.
        </p>
      ) : null}
    </PageShell>
  );
}
