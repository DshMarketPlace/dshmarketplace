import Link from "next/link";

import { Main, Section, Container } from "@/components/craft";
import { Badge } from "@/components/ui/badge";
import AdminHeader from "@/components/admin/admin-header";
import { getAdminQueue, getVisibilityCounts } from "@/lib/admin-data";
import { PROMOTION_THRESHOLD } from "@/lib/plugin-scoring";

export const dynamic = "force-dynamic";

const VISIBILITY_COPY: Record<string, string> = {
  hidden: "no page — browse card links to GitHub",
  listed: "page exists, noindex,follow",
  indexed: "in sitemap, index,follow",
};

export default async function AdminPage() {
  const [queue, counts] = await Promise.all([
    getAdminQueue(60),
    getVisibilityCounts(),
  ]);

  const byVisibility = Object.fromEntries(
    counts.map((c) => [c.visibility, Number(c.n)]),
  );
  const ready = queue.filter(
    (q) => q.visibility !== "indexed" && q.contentScore >= PROMOTION_THRESHOLD,
  ).length;

  return (
    <>
      <AdminHeader />
      <Main>
        <Section>
          <Container className="space-y-8">
            <header className="space-y-2">
              <h1 className="text-xl font-semibold">Rollout control</h1>
              <p className="text-sm text-muted-foreground">
                Pages are promoted in small daily batches. A page only qualifies
                once it carries something a scraped card does not — a written
                overview, real documentation, a resolved install path.
              </p>
            </header>

            <div className="grid gap-3 sm:grid-cols-4">
              {(["hidden", "listed", "indexed"] as const).map((v) => (
                <div key={v} className="rounded-lg border p-4">
                  <p className="text-2xl font-semibold">
                    {(byVisibility[v] ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs font-medium">{v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {VISIBILITY_COPY[v]}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-foreground/20 p-4">
                <p className="text-2xl font-semibold">{ready}</p>
                <p className="text-xs font-medium">ready to promote</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  score ≥ {PROMOTION_THRESHOLD}
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold">
                Queue — highest content score first
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2 text-left font-medium">Plugin</th>
                      <th className="p-2 text-right font-medium">Stars</th>
                      <th className="p-2 text-right font-medium">Score</th>
                      <th className="p-2 text-left font-medium">Overview</th>
                      <th className="p-2 text-left font-medium">LINUX DO</th>
                      <th className="p-2 text-left font-medium">Visibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-2 font-mono text-xs">
                          <Link href={`/plugins/${p.slug}`} className="hover:underline">
                            {p.fullName}
                          </Link>
                        </td>
                        <td className="p-2 text-right text-xs tabular-nums">
                          {p.stars.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-xs tabular-nums">
                          {p.contentScore}
                        </td>
                        <td className="p-2 text-xs">
                          {p.hasOverview ? "✓" : "—"}
                        </td>
                        <td className="p-2 text-xs">
                          {p.linuxdoUrl ? "✓" : "—"}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              p.visibility === "indexed" ? "default" : "outline"
                            }
                            className="font-normal"
                          >
                            {p.visibility}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Container>
        </Section>
      </Main>
    </>
  );
}
