import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms — DSH Marketplace",
  description:
    "Terms of use for the DSH Marketplace catalogue, including the limits of what a listing means.",
  alternates: alternatesFor("en", "/terms"),
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of use"
      updated="17 August 2026"
      lede="Using this catalogue means accepting the terms below. The important one is the third."
    >
      <h2>1. What this service is</h2>
      <p>
        DSH Marketplace is an index of publicly available software repositories
        relating to DeepSeek Harness. It hosts no plugin code. Every install
        command points at the third-party source that publishes it.
      </p>

      <h2>2. No affiliation</h2>
      <p>
        This is an independent project with no affiliation to, sponsorship by,
        or endorsement from DeepSeek. Product names and marks referenced here
        belong to their respective owners and are used only to describe what the
        indexed software is for.
      </p>

      <h2>3. Listings are not endorsements, reviews, or warranties</h2>
      <p>
        A listing means a repository exists and matched our sources. It does not
        mean the plugin is safe, functional, maintained, or fit for any purpose.
        Risk flags are heuristic and incomplete; their absence proves nothing.
      </p>
      <p>
        Plugins execute inside your agent with your agent&apos;s permissions.
        You are responsible for reviewing any code before you run it. To the
        fullest extent permitted by law, we accept no liability for loss or
        damage arising from software you find through this catalogue.
      </p>

      <h2>4. Third-party content</h2>
      <p>
        Repository descriptions, README content and screenshots remain the
        property of their authors and are reproduced under the licences those
        authors chose. Authors may request correction or removal at any time —
        see <Link href="/submit">Submit a plugin</Link>.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        The catalogue API is public and unauthenticated. Please keep request
        volume reasonable and identify your client with a user agent. We may
        rate-limit or block traffic that degrades the service for others.
      </p>
      <p>
        Do not use this site to distribute malware, misrepresent authorship, or
        submit repositories you do not have the right to submit.
      </p>

      <h2>6. Availability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;, without warranty of any
        kind. It may change, break, or stop being available without notice.
      </p>

      <h2>7. Changes</h2>
      <p>
        These terms may be updated; the date above reflects the current version.
        Continued use after a change constitutes acceptance of it.
      </p>

      <h2>8. Contact</h2>
      <p>
        <a href="mailto:hello@dshmarketplace.dev">hello@dshmarketplace.dev</a>
      </p>
    </PageShell>
  );
}
