import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy — DSH Marketplace",
  description:
    "What this site collects, what it does not, and who it shares data with.",
  alternates: alternatesFor("en", "/privacy"),
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy"
      updated="17 August 2026"
      lede="Short, because the site does very little with your data."
    >
      <h2>No account needed</h2>
      <p>
        Browsing this catalogue requires no account and no sign-up. The only
        cookie this site sets directly is a session cookie for its own
        administration area, which ordinary visitors never receive.
      </p>

      <h2>What is collected</h2>
      <ul>
        <li>
          <strong>Google Analytics.</strong> This site uses Google Analytics 4
          to measure which pages are visited and where visitors arrive from.
          Google sets its own cookies and processes your IP address to do this.
          It tells us how the catalogue is used in aggregate; it is not used to
          identify you personally, and we do not link it to any other data.
        </li>
        <li>
          <strong>Server logs.</strong> Our hosting provider records standard
          request data — IP address, user agent, requested path, timestamp — for
          delivery, security and abuse prevention. These are retained for a
          short period and are not used to build a profile of you.
        </li>
        <li>
          <strong>Email address</strong>, only if you type one into the contact
          field when submitting a plugin. That field is optional. It is used to
          reply about that submission and nothing else — there is no mailing
          list.
        </li>
        <li>
          <strong>Correspondence</strong>, if you email us about a listing.
        </li>
      </ul>

      <h2>What is not collected</h2>
      <p>
        No session recording, no advertising or remarketing audiences, no
        cross-site ad identifiers, and nothing is sold or shared with data
        brokers.
      </p>

      <h2>Opting out of analytics</h2>
      <p>
        Any browser setting, extension or tracking-protection feature that
        blocks Google Analytics works here; the catalogue is fully functional
        without it. Google also publishes a{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          rel="noopener nofollow"
        >
          browser opt-out add-on
        </a>
        .
      </p>

      <h2>The command-line tool</h2>
      <p>
        The <code>dshmarketplace</code> CLI sends the search terms you type to
        this site&apos;s public catalogue API in order to answer them. It sends
        no identifiers, reports no telemetry, and reads nothing from your
        machine.
      </p>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Google Analytics</strong> receives page-view data as described
          above, under{" "}
          <a href="https://policies.google.com/privacy" rel="noopener nofollow">
            Google&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Cloudflare</strong> serves this site and processes request
          data as described above.
        </li>
        <li>
          <strong>Turso</strong> hosts the catalogue database. It contains
          public repository metadata, not visitor data.
        </li>
        <li>
          <strong>GitHub</strong> is where plugin metadata is read from. Images
          and links on listing pages may load from GitHub&apos;s servers, which
          means GitHub sees those requests.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask what we hold about you, ask for it to be deleted, or
        unsubscribe at any time by writing to{" "}
        <a href="mailto:privacy@dshmarketplace.dev">privacy@dshmarketplace.dev</a>
        .
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, the date above changes with it.
      </p>
    </PageShell>
  );
}
