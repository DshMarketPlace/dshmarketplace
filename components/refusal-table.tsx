import Link from "next/link";

import type { getRefusalReport } from "@/lib/data";
import { t } from "@/lib/dict";
import { localePath, type Locale } from "@/lib/i18n";

type Report = Awaited<ReturnType<typeof getRefusalReport>>;

/**
 * The most-starred plugins dsh refused, each with the release that installed
 * instead. Every cell is a measurement: the range comes from the refusal the
 * harness printed, the release from a second install in the sandbox.
 */
export function RefusalTable({ report, locale }: { report: Report; locale: Locale }) {
  const d = t(locale).refusals;
  if (!report.rows.length) return <p>{d.empty}</p>;

  return (
    <div className="not-prose overflow-x-auto border border-border">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-paper-sunken text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{d.plugin}</th>
            <th className="px-3 py-2 font-medium">{d.needs}</th>
            <th className="px-3 py-2 font-medium">{d.installs(report.dsh ?? "")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {report.rows.map((r) => (
            <tr key={r.fullName}>
              <td className="px-3 py-2 align-top">
                {r.visibility === "hidden" ? (
                  <a href={r.repoUrl} rel="noopener" className="font-mono hover:text-copper">
                    {r.fullName}
                  </a>
                ) : (
                  <Link
                    href={localePath(locale, `/plugins/${r.slug}`)}
                    className="font-mono hover:text-copper"
                  >
                    {r.fullName}
                  </Link>
                )}
              </td>
              <td className="px-3 py-2 align-top font-mono text-muted-foreground">
                {r.requires || "—"}
              </td>
              <td className="px-3 py-2 align-top font-mono">
                {r.fallbackVersion && r.npmPackage ? (
                  `${r.npmPackage}@${r.fallbackVersion}`
                ) : (
                  <span className="text-muted-foreground">{d.none}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
