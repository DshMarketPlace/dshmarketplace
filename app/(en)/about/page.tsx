import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "About — DSH Marketplace",
  description:
    "An independent directory of DeepSeek Harness plugins. How listings are sourced, what the risk flags mean, and what this site is not.",
  alternates: alternatesFor("en", "/about"),
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="About DSH Marketplace"
      lede="An independent catalogue of DeepSeek Harness plugins, built because finding the right one is harder than installing it."
    >
      <h2>Why this exists</h2>
      <p>
        DeepSeek Harness ships almost nothing by default — every capability is a
        plugin, including the model connector. That design is the point, but it
        means a fresh install does very little until you have found the four or
        five plugins that match how you work.
      </p>
      <p>
        Those plugins are scattered across a GitHub topic with well over a
        thousand repositories and a community registry that covers a curated
        subset. Names are not predictable, descriptions are written in two
        languages, and a repository with thousands of stars is often famous for
        something other than its DSH plugin. This catalogue exists to make that
        pile searchable by <em>capability</em>.
      </p>

      <h2>Where listings come from</h2>
      <p>Two sources, and every listing records which one it came from:</p>
      <ul>
        <li>
          The{" "}
          <a href="https://github.com/topics/dsh-plugin" rel="noopener">
            <code>dsh-plugin</code> GitHub topic
          </a>
          , which any author can add to their own repository.
        </li>
        <li>
          The community registry that DeepSeek Harness&apos; own plugin market
          installs from, which applies a review before admitting a plugin.
        </li>
      </ul>
      <p>
        Star counts, licences, primary language and last-push dates are read
        from the GitHub API and refreshed on a schedule. Nothing on a listing is
        hand-typed except the editorial summary, where one exists.
      </p>

      <h2>What the risk flags mean</h2>
      <p>
        Plugins run inside your agent, with your agent&apos;s permissions. Where
        it is machine-detectable, listings say so before you install:
      </p>
      <ul>
        <li>
          <strong>Install script</strong> — the package runs a script at install
          time, before you have read anything.
        </li>
        <li>
          <strong>Terminal surface</strong> — the plugin executes shell
          commands.
        </li>
        <li>
          <strong>Requires credentials</strong> — the plugin asks for an API key
          or token.
        </li>
      </ul>

      <h2>What this site is not</h2>
      <p>
        <strong>It is not a security review.</strong> Detection is heuristic and
        reads only what a repository publishes. A listing without flags is not a
        clean bill of health, and being listed is not an endorsement. Read the
        source before you install it — every listing links to it.
      </p>
      <p>
        <strong>It is not affiliated with DeepSeek.</strong> This is an
        independent project. DeepSeek and DeepSeek Harness are the marks of
        their respective owner; they are used here only to describe what these
        plugins are for. The{" "}
        <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noopener">
          official project lives on GitHub
        </a>
        .
      </p>

      <h2>Corrections</h2>
      <p>
        Listings are generated from public metadata, so they inherit whatever is
        wrong upstream. If a listing misrepresents your plugin, or you would
        rather not be listed at all,{" "}
        <Link href="/contact">tell us</Link> and it will be corrected or removed.
      </p>
    </PageShell>
  );
}
