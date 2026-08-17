import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact — DSH Marketplace",
  description:
    "Report a wrong listing, request removal, or get in touch about the DeepSeek Harness plugin catalogue.",
  alternates: alternatesFor("en", "/contact"),
};

const ROUTES = [
  {
    subject: "A listing is wrong",
    to: "hello@dshmarketplace.dev",
    body: "Listings are generated from public repository metadata, so most errors are upstream — but if the catalogue got it wrong, send the plugin name and what is incorrect.",
  },
  {
    subject: "Remove my plugin",
    to: "hello@dshmarketplace.dev",
    body: "No justification needed. Send the repository URL from an address associated with the project, or open an issue on it, and the listing comes down.",
  },
  {
    subject: "Report a malicious plugin",
    to: "security@dshmarketplace.dev",
    body: "If an indexed plugin is doing something it does not disclose, this reaches us fastest. Include the repository and what you observed.",
  },
  {
    subject: "Privacy request",
    to: "privacy@dshmarketplace.dev",
    body: "Access, deletion, or unsubscribing — see the privacy page for what is held.",
  },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch"
      lede="One person maintains this. Email is the only channel, and it is read."
    >
      <div className="not-prose space-y-px border border-border bg-border">
        {ROUTES.map((r) => (
          <div key={r.subject} className="space-y-2 bg-background p-5">
            <h2 className="text-base font-medium">{r.subject}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {r.body}
            </p>
            <a
              href={`mailto:${r.to}?subject=${encodeURIComponent(r.subject)}`}
              className="inline-block font-mono text-sm text-copper hover:underline"
            >
              {r.to}
            </a>
          </div>
        ))}
      </div>

      <h2>Before you write</h2>
      <p>
        If you are trying to get a plugin <em>listed</em>, you probably do not
        need us at all — tagging your repository is faster. See{" "}
        <Link href="/submit">Submit a plugin</Link>.
      </p>
      <p>
        For questions about DeepSeek Harness itself rather than this catalogue,
        the{" "}
        <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noopener">
          official repository
        </a>{" "}
        is the right place.
      </p>
    </PageShell>
  );
}
