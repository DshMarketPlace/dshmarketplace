import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { CopyCommand } from "@/components/copy-command";
import { SubmitForm } from "@/components/submit-form";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Submit a DeepSeek Harness plugin — DSH Marketplace",
  description:
    "Get your DeepSeek Harness plugin listed. Add the dsh-plugin topic to your repository, or submit it directly.",
  alternates: alternatesFor("en", "/submit"),
};

export default function SubmitPage() {
  return (
    <PageShell
      eyebrow="For authors"
      title="Submit a plugin"
      lede="Most plugins are found automatically. If yours is not listed yet, here is why — and how to fix it in about a minute."
    >
      <h2>Submit a repository</h2>
      <p>
        Paste the repository URL and we will read its public metadata before you
        commit to anything — the topic, the licence, the description, and
        whether it is already listed. Submissions are reviewed by hand before
        they are published.
      </p>
      <SubmitForm locale="en" />

      <h2>The faster route: tag your repository</h2>
      <p>
        This catalogue syncs the <code>dsh-plugin</code> GitHub topic. Adding
        that topic to your repository gets you listed on the next sync, with no
        submission needed — and it also makes you discoverable to every other
        DSH plugin market, including the one built into DeepSeek Harness.
      </p>
      <p>
        On GitHub, open your repository, click the gear beside{" "}
        <em>About</em>, and add <code>dsh-plugin</code> to Topics. Or from the
        command line:
      </p>
      <CopyCommand
        size="lg"
        command="gh repo edit --add-topic dsh-plugin"
        className="not-prose my-4"
      />

      <h2>What makes a listing look good</h2>
      <p>
        Listings are generated from what your repository publishes, so these are
        the fields worth filling in:
      </p>
      <ul>
        <li>
          <strong>Repository description</strong> — this becomes the summary on
          your card. One sentence about the capability, not the implementation.
        </li>
        <li>
          <strong>A licence file</strong> — repositories without one are
          all-rights-reserved by default, and listings say so.
        </li>
        <li>
          <strong>A README with install instructions</strong> — it is rendered
          on your detail page, so it doubles as your landing page here.
        </li>
        <li>
          <strong>An npm package</strong>, if you publish one. Installs resolve
          a tarball instead of cloning, which is noticeably faster for users.
        </li>
      </ul>

      <h2>Getting into the curated registry</h2>
      <p>
        Listings marked as being in the registry passed a review by the
        community project that DeepSeek Harness&apos; built-in plugin market
        installs from. That is a separate project from this one — open a pull
        request against{" "}
        <a
          href="https://github.com/awesome-dsh-plugin/awesome-dsh-plugin"
          rel="noopener"
        >
          awesome-dsh-plugin
        </a>{" "}
        to be considered.
      </p>

      <h2>Corrections and removal</h2>
      <p>
        If a listing gets your plugin wrong, or you would rather not be listed,
        say so and it will be corrected or removed — no justification needed.
        Untag the repository and it also drops out on the next sync.
      </p>
      <p>
        Reach us at{" "}
        <a href="mailto:hello@dshmarketplace.dev">hello@dshmarketplace.dev</a>.
      </p>
    </PageShell>
  );
}
