import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { getCatalogStats } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness Plugin API — Free, No Key | DSH Marketplace",
  description:
    "A public JSON API for DeepSeek Harness plugins: search the catalogue, or pull every listing in one request. No key, no sign-up, CORS open. Install commands are verified, never guessed.",
  alternates: alternatesFor("en", "/api-docs"),
};

export default async function ApiDocsPage() {
  const stats = await getCatalogStats();
  const total = stats.total.toLocaleString();

  return (
    <PageShell
      wide
      eyebrow="API"
      title="DSH Marketplace API"
      lede={`A public JSON API over ${total} DeepSeek Harness plugins. No key, no sign-up, CORS open — the same endpoints this site, the CLI, the Python package and the in-harness plugin all read from.`}
    >
      <h2>Two endpoints</h2>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>GET /api/v1/plugins</code>
            </td>
            <td>Tell me about this plugin.</td>
          </tr>
          <tr>
            <td>
              <code>GET /api/v1/index</code>
            </td>
            <td>Which of these thousand repositories are plugins at all?</td>
          </tr>
        </tbody>
      </table>
      <p>
        Both are open over CORS and need no authentication. If you are building
        a directory, a chat tool or an agent that installs plugins, take them —
        that is what they are for, and it beats crawling the GitHub topic again.
      </p>

      <h2>
        <code>GET /api/v1/plugins</code>
      </h2>
      <pre>
        <code>
          curl -s
          &apos;https://dshmarketplace.dev/api/v1/plugins?q=memory&amp;limit=5&apos;
        </code>
      </pre>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>q</code>
            </td>
            <td>
              Free text, matched against the repository name, both summaries and
              the description
            </td>
          </tr>
          <tr>
            <td>
              <code>category</code>
            </td>
            <td>One of the 14 category ids</td>
          </tr>
          <tr>
            <td>
              <code>limit</code>
            </td>
            <td>1–100, default 20</td>
          </tr>
          <tr>
            <td>
              <code>page</code>
            </td>
            <td>1-based</td>
          </tr>
        </tbody>
      </table>
      <p>
        Every result carries both summaries, the resolved install command, the
        detected risk flags and the source repository:
      </p>
      <pre>
        <code>{`{
  "fullName": "liustack/modlens",
  "summary": "…",
  "summaryZh": "…",
  "category": "vision",
  "stars": 2325,
  "license": "MIT",
  "npmPackage": "@liustack/modlens",
  "installKind": "npm",
  "install": "dsh plugin --profile web add @liustack/modlens",
  "installable": true,
  "installOptions": [{ "label": "npm", "cmd": "…", "note": "…" }],
  "riskFlags": ["terminal surface"],
  "repoUrl": "https://github.com/liustack/modlens",
  "url": "https://dshmarketplace.dev/plugins/liustack-modlens"
}`}</code>
      </pre>

      <h3>
        The <code>install</code> contract
      </h3>
      <p>
        <strong>
          <code>install</code> is <code>null</code> rather than a placeholder
          when no command can install the plugin.
        </strong>{" "}
        This is the part worth reading twice if you are writing an agent. A
        caller that runs whatever is in that field must never be handed a string
        that fails, so the field is empty instead — and{" "}
        <code>installable</code> says the same thing as a boolean.
      </p>
      <p>Two cases produce it, and both are real:</p>
      <ul>
        <li>
          <strong>A plugin in a monorepo subdirectory.</strong>{" "}
          <code>dsh plugin add</code> forwards to pnpm, and pnpm reads
          everything after <code>#</code> as a git ref, so{" "}
          <code>github:owner/repo#packages/thing</code> cannot resolve. There is
          no one-line install, so none is offered.
        </li>
        <li>
          <strong>A plugin published nowhere.</strong> No npm package and no
          installable repository root.
        </li>
      </ul>
      <p>
        Every command that <em>is</em> returned carries{" "}
        <code>--profile web</code>. <code>dsh plugin</code> is a thin forward to
        pnpm inside a profile directory, so the flag is mandatory — without it
        the CLI exits with{" "}
        <code>required option &apos;--profile &lt;name&gt;&apos; not specified</code>{" "}
        and nothing installs. Swap <code>web</code> for your own profile name if
        you run another one.
      </p>

      <h2>
        <code>GET /api/v1/index</code>
      </h2>
      <pre>
        <code>curl -s &apos;https://dshmarketplace.dev/api/v1/index&apos;</code>
      </pre>
      <p>
        The whole catalogue in one response, for clients that must decide
        whether a page full of repositories contains plugins and cannot ask
        about them one at a time. Rows are positional to keep it small — around
        22&nbsp;KB over the wire — and the column names ship with the payload:
      </p>
      <pre>
        <code>{`{
  "generated": "2026-08-17T09:12:44.108Z",
  "count": ${stats.total},
  "site": "https://dshmarketplace.dev",
  "fields": ["fullName", "category", "install", "path", "npm"],
  "plugins": [
    ["liustack/modlens", "vision", "dsh plugin --profile web add @liustack/modlens", "/plugins/liustack-modlens", "@liustack/modlens"]
  ]
}`}</code>
      </pre>
      <p>
        <code>path</code> is <code>null</code> when a listing has no page of its
        own yet, and <code>npm</code> is <code>null</code> when the plugin
        publishes nowhere. As with <code>install</code>, none of them is ever a
        placeholder.
      </p>

      <h2>What is in the catalogue</h2>
      <p>
        {total} listings, drawn from the community registry and the{" "}
        <a href="https://github.com/topics/dsh-plugin" rel="noopener">
          <code>dsh-plugin</code> GitHub topic
        </a>
        . The topic is not a registry, so admission is gated — and the bar is
        published here because a filter nobody can check is not a filter:
      </p>
      <ul>
        <li>
          <strong>It declares a DSH plugin.</strong> A <code>dsh</code> manifest
          in <code>package.json</code>, a dependency on{" "}
          <code>@deepseek-ai/*</code> or Cordis, or a{" "}
          <code>cordis.patch.yml</code>. Other harnesses and agent clients tag
          themselves <code>dsh-plugin</code> for the attention; they are not
          installable here and are not listed.
        </li>
        <li>
          <strong>Ten commits or more.</strong> Taken from{" "}
          <a
            href="https://github.com/awesome-dsh-plugin/awesome-dsh-plugin"
            rel="noopener"
          >
            awesome-dsh-plugin
          </a>
          &apos;s own bar rather than invented here, so the standard is one you
          can check against someone else&apos;s. A scaffold has a valid manifest
          on its first commit; commit count is what tells it apart from work.
        </li>
        <li>
          <strong>It says what it does.</strong> A repository with no
          description at all is a link, and a link is what every other directory
          already gives you.
        </li>
      </ul>
      <p>
        Applying that bar removed 1,415 rows in one pass — 754 of them
        repositories with fewer than five commits. A directory&apos;s value is
        what it leaves out.
      </p>

      <h2 id="install-check">Every listing is install-tested</h2>
      <p>
        This is the one thing a scraper cannot copy. Each install command is run
        in a throwaway container that has never seen the plugin, and the result
        is recorded against that exact command — it is{" "}
        <code>installCheck</code> on the API and a badge on every card and page.
        A name in a repository is not evidence that it installs; the run is.
      </p>
      <table>
        <thead>
          <tr>
            <th>Verdict</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>passed</code>
            </td>
            <td>Installed and registered as a plugin, no intervention.</td>
          </tr>
          <tr>
            <td>
              <code>needs-approval</code>
            </td>
            <td>
              Installs once a build script is allowlisted, which{" "}
              <code>dshmarketplace-cli</code> does for you. Counted as
              installable.
            </td>
          </tr>
          <tr>
            <td>
              <code>not-a-layer</code>
            </td>
            <td>
              The package installs but declares no plugin layer — not a failure,
              not a plugin. Left out of the rate entirely.
            </td>
          </tr>
          <tr>
            <td>
              <code>failed</code> / <code>timeout</code>
            </td>
            <td>Did not install. The few percent we flag instead of letting you find out.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The headline <em>N% install-verified</em> is <code>passed</code> plus{" "}
        <code>needs-approval</code> over everything actually run —{" "}
        <code>not-a-layer</code> and untested rows are excluded from both sides,
        so it is a rate over tested plugins, not a claim about the whole
        catalogue. Verdicts are produced under a pinned <code>pnpm&nbsp;10</code>;
        an older pnpm reports a blocked build script as a hard failure, which
        only understates the number.
      </p>

      <h2>Caching and fair use</h2>
      <p>
        Responses carry <code>Cache-Control</code> and are served from
        Cloudflare&apos;s edge. There is no rate limit and no key, which only
        works if clients behave like clients: cache the index rather than
        fetching it per page view, and prefer one <code>/api/v1/index</code>{" "}
        call over a thousand <code>/api/v1/plugins</code> calls. The userscript
        below refreshes at most every six hours, and that is the intended shape.
      </p>

      <h2>Four reference implementations</h2>
      <p>
        Every one of these reads the endpoints above, and all of them are MIT
        on <a href="https://github.com/DshMarketPlace">GitHub</a>. If you are
        wiring this into something, one of them has already solved your problem:
      </p>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dshmarketplace-cli">
                npm
              </a>
            </td>
            <td>
              <code>npx dshmarketplace-cli find memory</code> — a stable{" "}
              <code>--json</code> contract for agents
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dshmarketplace-py">
                PyPI
              </a>
            </td>
            <td>
              <code>pip install dshmarketplace</code> — zero dependencies, sync
              and async
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://github.com/DshMarketPlace/dsh-plugins-store">
                In DSH
              </a>
            </td>
            <td>
              <code>dsh plugin --profile web add dshmarketplace-plugin</code> —{" "}
              <code>/store</code>, plus two agent-callable tools
            </td>
          </tr>
          <tr>
            <td>
              <a href="https://greasyfork.org/scripts/591735-dsh-plugin-radar">
                Userscript
              </a>
            </td>
            <td>
              Marks plugins on GitHub and npm — one file, no build, no
              dependency
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Terms</h2>
      <p>
        Free to use, including commercially. No key, no sign-up, no attribution
        required — a link back is appreciated and never demanded. The data is
        public repository metadata plus summaries written here; it carries no
        warranty, and a listing is not a security review. See{" "}
        <Link href="/about">what this site is not</Link>.
      </p>
      <p>
        Found a listing that is wrong, or want yours removed?{" "}
        <Link href="/contact">Say so</Link> and it will be fixed.
      </p>
    </PageShell>
  );
}
