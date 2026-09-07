import type { Metadata } from "next";

import { PageShell } from "@/components/page-shell";
import { alternatesFor } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Links — DSH Marketplace",
  description:
    "Independent sites in the DeepSeek Harness ecosystem we exchange links with.",
  alternates: alternatesFor("en", "/links"),
  // A page of outbound links to peer directories is not something to rank; it
  // exists so an exchange has an address. Held out of the sitemap for the same
  // reason listed plugin pages are.
  robots: { index: false, follow: true },
};

export default function LinksPage() {
  return (
    <PageShell
      eyebrow="Links"
      title="Friend links"
      lede="Independent sites in the DeepSeek Harness ecosystem we point to, and that point back. Outbound links here are nofollow."
    >
      <div className="not-prose my-6 border border-border">
        <a
          href="https://dpharness.com/"
          target="_blank"
          rel="noopener nofollow"
          className="block p-4 transition-colors hover:border-copper"
        >
          <div className="font-medium">DeepSeek Harness Hub</div>
          <div className="mt-1 text-sm text-muted-foreground">
            A Chinese-language DSH plugin directory, with compatibility checks,
            risk flags and one-click install.
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            dpharness.com
          </div>
        </a>
      </div>

      <h2>Exchange a link</h2>
      <p>
        If you run a site about DeepSeek Harness, its plugins or the tools
        around it, reach us through the <a href="/contact">contact page</a> with
        your site name, URL and a one-line description. Outbound links from this
        page carry <code>rel=&quot;nofollow&quot;</code>.
      </p>
    </PageShell>
  );
}
