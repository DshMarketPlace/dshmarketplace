import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

import type { Plugin } from "@/db/schema";
import { t } from "@/lib/dict";
import { relativeTime, type Locale } from "@/lib/i18n";
import { securityFacts, type BlockedBuild } from "@/lib/security";
import { cn } from "@/lib/utils";

/**
 * What installing a plugin runs, from the three things we hold: the sandbox
 * install, and the package.json and README scans made during sync. Each row
 * carries its source in the row itself — a label without its provenance is a
 * badge, and badges get read as audits.
 */
export function SecurityPanel({ plugin, locale }: { plugin: Plugin; locale: Locale }) {
  const d = t(locale).security;
  const facts = securityFacts(plugin);
  const ranAgo = relativeTime(plugin.installCheckedAt, locale);
  const { build, lifecycle, readme } = facts;

  const readmeHits = readme
    ? [readme.terminal ? d.readmeTerminal : null, readme.credentials ? d.readmeCredentials : null]
        .filter((x): x is string => x !== null)
        .join(locale === "zh" ? "；" : "; ")
    : "";

  return (
    <section className="space-y-4">
      <div className="space-y-1.5">
        <p className="eyebrow">{d.eyebrow}</p>
        <h2 className="display text-xl">{d.heading(plugin.name)}</h2>
      </div>

      <dl className="grid gap-px border border-border bg-border text-sm">
        <Row
          label={d.buildLabel}
          alert={build.kind === "held" || build.kind === "skipped"}
          source={
            build.kind === "unmeasured" && build.reason === "never"
              ? null
              : d.buildSource(plugin.installDshVersion, ranAgo)
          }
        >
          {build.kind === "held" ? (
            <>
              <p>{build.builds.length ? d.buildHeld : d.buildHeldEmpty}</p>
              <Builds builds={build.builds} self={d.buildSelf} />
              <p>{d.buildApprove}</p>
            </>
          ) : build.kind === "skipped" ? (
            <>
              <p>{d.buildSkipped}</p>
              <Builds builds={build.builds} self={d.buildSelf} />
              <p>{d.buildSkippedNote}</p>
            </>
          ) : build.kind === "none" ? (
            <p>{d.buildNone}</p>
          ) : (
            <p>
              {build.reason === "never"
                ? d.buildNever
                : build.reason === "refused"
                  ? d.buildRefused
                  : d.buildIncomplete}
            </p>
          )}
        </Row>

        <Row
          label={d.lifecycleLabel}
          alert={lifecycle === true}
          source={lifecycle === null ? null : d.lifecycleSource}
        >
          <p>{lifecycle === null ? d.notScanned : lifecycle ? d.lifecycleYes : d.lifecycleNo}</p>
        </Row>

        <Row
          label={d.readmeLabel}
          alert={false}
          source={readme === null ? null : d.readmeSource}
        >
          <p>{readme === null ? d.notScanned : readmeHits || d.readmeNo}</p>
        </Row>
      </dl>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <ShieldAlert className="mt-[0.15rem] h-3 w-3 shrink-0" aria-hidden />
        <span>{d.footer}</span>
      </p>
    </section>
  );
}

function Row({
  label,
  alert,
  source,
  children,
}: {
  label: string;
  /** Copper marks a row that asks something of the reader, not a verdict. */
  alert: boolean;
  source: string | null;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 bg-card p-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className={cn("text-xs font-medium", alert ? "text-copper" : "text-muted-foreground")}>
        {label}
      </dt>
      <dd className="min-w-0 space-y-2 leading-relaxed text-muted-foreground">
        {children}
        {source ? <p className="text-xs leading-relaxed text-ink-faint">{source}</p> : null}
      </dd>
    </div>
  );
}

function Builds({ builds, self }: { builds: BlockedBuild[]; self: string }) {
  if (!builds.length) return null;
  return (
    <ul className="space-y-1">
      {builds.map((b) => (
        <li key={b.name} className="text-xs">
          <code className="break-all font-mono text-foreground">{b.name}</code>
          {b.self ? <span className="text-ink-faint"> — {self}</span> : null}
        </li>
      ))}
    </ul>
  );
}
