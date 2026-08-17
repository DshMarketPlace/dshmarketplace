/**
 * Verifies every npm name in the catalogue against the registry.
 *
 *   pnpm tsx scripts/repair-npm-claims.ts [--dry]
 *
 * `sync-github.ts` already refuses to record an unpublished name, but it only
 * checks the rows it happens to refresh — 400 a night against 2,356 listings.
 * Everything ingested before that guard existed kept its claim, so hundreds of
 * listings were serving a command that 404s. This sweeps all of them.
 *
 * Two ways a claim can be wrong, and both are checked:
 *
 *   absent   — the name is not on the registry at all.
 *   foreign  — the name resolves, but to somebody else's package. A repo whose
 *              package.json says `"name": "aegis"` does not own `aegis`; we
 *              installed an abandoned library of that name and were about to
 *              publish its failure as the plugin author's.
 *
 * Anything else is left alone. A registry hiccup, a missing `repository`
 * field, or a URL we cannot parse all mean "unknown", and unknown must never
 * strip a command that works.
 *
 * Two probes, because they do not cost the same. HEAD on the packument answers
 * "does this exist" and the registry serves it happily in bulk. The ownership
 * check needs a body, and GET returns 429 well before this many requests are
 * done — so it runs narrow, backs off, and gives up in favour of keeping the
 * claim rather than guessing.
 */
import "dotenv/config";
import { eq, isNotNull } from "drizzle-orm";

import { db } from "../db/client";
import { plugins } from "../db/schema";

const DRY = process.argv.includes("--dry");
const EXISTS_CONCURRENCY = 16;
const OWNER_CONCURRENCY = 4;

const encode = (name: string) => name.replace("/", "%2f");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** github.com/o/r, git+ssh://…/o/r.git, o/r — all reduce to the owner. */
function repoOwner(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com[:/]+([^/]+)\/([^/#?]+?)(?:\.git)?(?:[#?].*)?$/i);
  if (m) return m[1].toLowerCase();
  const bare = url.match(/^([\w.-]+)\/([\w.-]+)$/);
  return bare ? bare[1].toLowerCase() : null;
}

/** Undefined means the registry would not say. */
async function exists(name: string): Promise<boolean | undefined> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://registry.npmjs.org/${encode(name)}`, {
        method: "HEAD",
        headers: { "User-Agent": "dshmarketplace-repair" },
      });
      if (res.status === 404) return false;
      if (res.ok) return true;
      if (res.status === 429) await sleep(2000 * (attempt + 1));
      else return undefined;
    } catch {
      await sleep(1000 * (attempt + 1));
    }
  }
  return undefined;
}

/** The GitHub owner the published package points back at, if it says. */
async function publisher(name: string): Promise<string | null | undefined> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(
        `https://registry.npmjs.org/${encode(name)}/latest`,
        { headers: { "User-Agent": "dshmarketplace-repair" } },
      );
      if (res.status === 429) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return undefined;
      const m = (await res.json()) as { repository?: string | { url?: string } };
      return repoOwner(
        typeof m.repository === "string" ? m.repository : m.repository?.url,
      );
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return undefined;
}

async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (;;) {
        const item = queue.shift();
        if (!item) return;
        await run(item);
      }
    }),
  );
}

async function main() {
  const rows = await db
    .select({
      id: plugins.id,
      fullName: plugins.fullName,
      owner: plugins.owner,
      repo: plugins.repo,
      subpath: plugins.subpath,
      npmPackage: plugins.npmPackage,
    })
    .from(plugins)
    .where(isNotNull(plugins.npmPackage));

  console.log(`checking ${rows.length} listings that claim an npm package`);

  const names = [...new Set(rows.map((r) => r.npmPackage!))];
  const present = new Map<string, boolean | undefined>();
  let seen = 0;

  await pool(names, EXISTS_CONCURRENCY, async (name) => {
    present.set(name, await exists(name));
    if (++seen % 200 === 0) console.log(`  existence ${seen}/${names.length}`);
  });

  const absent = names.filter((n) => present.get(n) === false);
  const live = names.filter((n) => present.get(n) === true);
  const unknown = names.length - absent.length - live.length;
  console.log(`\n  on the registry ${live.length}`);
  console.log(`  absent          ${absent.length}`);
  console.log(`  unreachable     ${unknown} (left alone)`);

  // Only names that resolve need an owner. A scope that matches the GitHub
  // owner is proof enough on its own and saves a request.
  const owners = new Map<string, string | null | undefined>();
  const needOwner = live.filter((n) => {
    const scope = n.startsWith("@") ? n.slice(1, n.indexOf("/")).toLowerCase() : null;
    return !(
      scope && rows.some((r) => r.npmPackage === n && r.owner.toLowerCase() === scope)
    );
  });

  console.log(`\n  resolving publisher for ${needOwner.length}`);
  seen = 0;
  await pool(needOwner, OWNER_CONCURRENCY, async (name) => {
    owners.set(name, await publisher(name));
    if (++seen % 100 === 0) console.log(`  owner ${seen}/${needOwner.length}`);
  });

  const stripped: { fullName: string; name: string; why: string }[] = [];
  let kept = 0;

  for (const row of rows) {
    const name = row.npmPackage!;
    const isAbsent = present.get(name) === false;
    const declared = owners.get(name);
    // A repo rename is not a collision: the same author republishing from
    // `foo` to `dsh-foo` still owns the package. Only a different *owner* is
    // evidence that the name belongs to somebody else.
    const isForeign =
      !isAbsent &&
      typeof declared === "string" &&
      declared !== row.owner.toLowerCase();

    if (!isAbsent && !isForeign) {
      kept++;
      continue;
    }

    stripped.push({
      fullName: row.fullName,
      name,
      why: isAbsent ? "absent" : `belongs to ${declared}`,
    });

    if (DRY) continue;
    await db
      .update(plugins)
      .set({
        npmPackage: null,
        // A subpath plugin has no working command at all once npm is gone;
        // `installOptions` returns an empty list and the page explains why.
        installKind: row.subpath ? "unknown" : "github",
        // Whatever the sandbox measured, it measured against a command we are
        // now retracting. Keeping the verdict would attribute another
        // package's failure to this repository.
        installStatus: null,
        installDetail: null,
        blockedBuilds: null,
        installCheckedAt: null,
        // And a review that cites a measurement cannot outlive it. These said
        // "沙箱实测显示…" about installs of packages the authors never
        // published — a sentence about someone else's abandoned library,
        // published under their name. It regenerates once the real command
        // has been through the sandbox.
        review: null,
        reviewZh: null,
        reviewHtml: null,
        reviewHtmlZh: null,
        reviewModel: null,
        reviewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(plugins.id, row.id));
  }

  const foreign = stripped.filter((s) => s.why !== "absent");
  console.log(`\nkept ${kept}, stripped ${stripped.length}${DRY ? " (dry run)" : ""}`);
  console.log(`  absent  ${stripped.length - foreign.length}`);
  console.log(`  foreign ${foreign.length}`);
  for (const s of foreign) {
    console.log(`    ${s.fullName} claimed ${s.name}, which ${s.why}`);
  }
}

main();
