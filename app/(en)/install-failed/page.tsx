import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { RefusalTable } from "@/components/refusal-table";
import { getRefusalReport } from "@/lib/data";
import { alternatesFor } from "@/lib/i18n";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "DeepSeek Harness Plugin Install Failed? Fix “incompatible with dsh”",
  description:
    "Why DeepSeek Harness 0.2 stops with “installation rejected … is incompatible with dsh”, four fixes, and the release that installs for each refused plugin — measured in a sandbox.",
  alternates: alternatesFor("en", "/install-failed"),
};

const ERROR = `dsh: installation rejected: Plugin dsh-better-sidebar@0.28.0 is incompatible with dsh 0.2.0-rc.2: peerDependencies {"@deepseek-ai/dsh-tools":"^0.2.1-rc.1", …}. Running it may cause crashes or data loss. …
dsh: nothing was installed.`;

export default async function InstallFailedPage() {
  const report = await getRefusalReport();
  const dsh = report.dsh ?? "0.2";

  return (
    <PageShell
      wide
      eyebrow="Troubleshooting"
      title="Plugin install failed: “incompatible with dsh”"
      lede="If dsh plugin add stopped with “installation rejected … is incompatible with dsh”, the plugin is not broken. DeepSeek Harness 0.2 refuses plugins built for another version of it, and most of them have an older release that installs."
    >
      <h2>What the error means</h2>
      <pre>
        <code>{ERROR}</code>
      </pre>
      <p>
        Since 0.2.0-rc.1, published on 28 September 2026, DeepSeek Harness checks
        a plugin&apos;s declared dsh range before it installs anything. It reads{" "}
        <code>engines.dsh</code> from the plugin&apos;s <code>package.json</code>;
        a plugin without one is checked against every{" "}
        <code>@deepseek-ai/dsh*</code> peer dependency instead. When the running
        dsh falls outside that range, DeepSeek Harness refuses and rolls the
        profile back. Most plugins written in August declare a range such as{" "}
        <code>^0.1.0-rc.6</code>, which contains no 0.2 release at all.
      </p>
      <p>Two things about it catch people out:</p>
      <ul>
        <li>
          <strong>The whole command is refused.</strong>{" "}
          <code>dsh plugin add a b c</code> installs nothing if any one of the
          three is out of range — which is how a working set of plugins can fail
          as a set.
        </li>
        <li>
          <strong>It is about versions, not quality.</strong> The same plugin can
          install on one DeepSeek Harness release and be refused by the next.
          Updating the harness can cause it, and updating the harness can also
          be the fix.
        </li>
      </ul>

      <h2>How common it is</h2>
      {report.tested > 0 ? (
        <p>
          So far we have run {report.tested.toLocaleString()} plugins on
          DeepSeek Harness {dsh}, each in a throwaway sandbox against a clean
          profile. {report.refused.toLocaleString()} of them were refused at
          this check, and for {report.rescued.toLocaleString()} of those an
          older release installed cleanly on the same dsh. The rest of the
          catalogue is being re-run; these numbers update as it lands.
        </p>
      ) : (
        <p>
          The catalogue is being re-run on the current DeepSeek Harness; counts
          appear here as the results land.
        </p>
      )}

      <h2>Fixes, easiest first</h2>
      <ol>
        <li>
          <strong>Let the CLI pick the release.</strong>{" "}
          <code>npx dshmarketplace-cli add &lt;plugin&gt;</code> reads your dsh
          version and installs the newest release your harness accepts, by the
          same rule the harness applies. It works for several plugins at once,
          and for the <Link href="/presets">presets</Link>.
        </li>
        <li>
          <strong>Pin a release yourself.</strong> Every listing we have run on
          the current dsh shows the release that installed, with its command —
          for example{" "}
          <code>dsh plugin --profile web add dsh-better-sidebar@0.26.1</code>.
          The table below lists the most-starred ones.
        </li>
        <li>
          <strong>Force it, knowingly.</strong> The error itself prints an
          exact-version exemption:{" "}
          <code>
            dsh plugin --profile web allow-version &lt;name&gt;@&lt;version&gt;
            --dsh-version &lt;your dsh&gt; --accept-risk
          </code>
          . DeepSeek Harness&apos;s own warning stands — running it may cause
          crashes or data loss — so keep it for a plugin with no compatible
          release whose source you have read.
        </li>
        <li>
          <strong>Update, or wait.</strong> Sometimes the latest release needs a
          newer dsh than you run: dsh-better-sidebar 0.28.0 asks for{" "}
          <code>^0.2.1-rc.1</code>, so updating DeepSeek Harness fixes that one.
          Otherwise the author has to widen the range.
        </li>
      </ol>

      <h2>If you maintain a plugin</h2>
      <p>
        Declare <code>engines.dsh</code> in <code>package.json</code>, covering
        every DeepSeek Harness release you have tested. From 0.2.1 the harness
        reads it before the peer ranges, and a declared <code>engines.dsh</code>{" "}
        decides compatibility on its own — so it is the one field that controls
        whether your plugin installs. Your listing here shows what our sandbox
        saw on the current dsh, and the{" "}
        <Link href="/api-docs#install-check">install check</Link> explains how
        it runs.
      </p>

      <h2>Other ways an install goes wrong</h2>
      <ul>
        <li>
          <strong>It “succeeded” and nothing appeared.</strong>{" "}
          <code>dsh plugin</code> installs into a profile, and without{" "}
          <code>--profile</code> it has none to install into. Every command in
          this catalogue carries <code>--profile web</code>; swap in your profile
          name if you run another.
        </li>
        <li>
          <strong>pnpm refused a build script.</strong> pnpm will not run a
          package&apos;s build script until it is allowlisted, and until then the
          harness may never register the plugin. Add the key pnpm prints to{" "}
          <code>allowBuilds</code> in the profile&apos;s{" "}
          <code>pnpm-workspace.yaml</code> and run the command again — or let{" "}
          <code>dshmarketplace-cli</code> do it.
        </li>
        <li>
          <strong>A GitHub install stops at its prepare script.</strong> A source
          install builds the plugin on your machine, which pnpm blocks the same
          way. Same fix; or install the npm package if the listing offers one.
        </li>
      </ul>

      <h2>Most-starred plugins refused on DeepSeek Harness {dsh}</h2>
      <RefusalTable report={report} locale="en" />
    </PageShell>
  );
}
