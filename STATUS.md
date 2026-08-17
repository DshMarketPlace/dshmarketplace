# Status — 17 August 2026

Live, seeded, and holding the name. A long way from finished.

## What is running

| | |
| --- | --- |
| Site | <https://dshmarketplace.dev> — Next.js 16 on Cloudflare Workers via OpenNext |
| Languages | English at `/`, Chinese at `/zh` — separate root layouts, bidirectional hreflang |
| Database | Turso (libSQL), 1,002 plugins with GitHub metadata, all with bilingual summaries |
| Detail pages | 28 written bilingually, each with a documentation section; 25 illustrated |
| LINUX DO | 6 plugins verified against the thread their author posted |
| Content pipeline | `write-content.ts` → `promote.ts`. Text on one gateway, images on another |
| CLI | `npx dshmarketplace-cli` — [npm](https://www.npmjs.com/package/dshmarketplace-cli) · repo **public, MIT** |
| Python | `pip install dshmarketplace` — [PyPI](https://pypi.org/project/dshmarketplace/) · repo **public, MIT**. Zero dependencies, `dshm` CLI, agent tools, 3.9–3.13 |
| In-DSH plugin | `dsh plugin --profile web add dshmarketplace-plugin` — [npm](https://www.npmjs.com/package/dshmarketplace-plugin) · repo **public, MIT**. Verified running in a real harness |
| Userscript | [DSH Plugin Radar](https://greasyfork.org/scripts/591735-dsh-plugin-radar) — marks plugins on GitHub and npm · [repo](https://github.com/DshMarketPlace/dsh-plugin-radar) **public, MIT**. Live on Greasy Fork 17 Aug 2026 |
| This repo | **Public, MIT**, history squashed to one commit |
| Analytics | GA4 `G-R6HWVQVVVB`, all pages |
| Launch | [LINUX DO thread](https://linux.do/t/topic/2765838), 17 Aug 2026 |

**Five surfaces, one API.** The site, the npm CLI, the Python package, the
in-DSH plugin and the userscript all read the same endpoints, so a listing
cannot say one thing in a browser and another inside the harness. The Python
package's `pytest -m live` enforces that from the outside: it asserts against
the real catalogue that every published command survives the install guard,
carries `--profile`, and agrees with its own `installable` flag.

Two public endpoints, both CORS-open:

- `/api/v1/plugins?q=&category=&limit=` — the full record for a plugin.
- `/api/v1/index` — every listing, five positional columns, one request.
  113 KB, 22 KB gzipped. Exists because a client decorating a page full of
  repositories cannot ask about them one at a time. **Deliberately
  `force-dynamic`**: `promote.ts` and `sync-github.ts` write straight to the
  database without a deploy, and a prerendered index would disagree with
  `/api/v1/plugins` until the next push.

Pages, each in both languages: `/` (hero, catalogue, how-it-works, FAQ),
`/p/[slug]`, `/about`, `/submit`, `/contact`, `/terms`, `/privacy`. English-only:
`/admin`, `/api/v1/*`. Sitemap: 56 URLs.

## The strategy this is built around

Six or more directories already index DSH plugins, and they are all thin card
walls that link straight out to GitHub. **The gap is depth**: a page per plugin
that carries writing a scraper cannot produce. That is the whole differentiation,
and it is why `overview` and `contentScore` exist.

Three further moats, in build order:

1. **The CLI is aimed at coding agents.** `--json` is a stable contract and
   `add --dry-run --json` resolves an install without running it. `SKILL.md`
   ships inside the package so agents discover when to reach for it.
2. **Install counts.** Star counts are scrapeable by anyone; real install
   numbers are not. `POST /api/v1/installs` is live and the in-DSH plugin
   reports into it. No leaderboard page reads it yet.
3. **A companion in-DSH plugin** reading this same API. **Shipped and verified
   in a real harness**, alongside a Python client — four surfaces now share one
   endpoint.

## Two decisions worth not re-litigating

**Visibility is three-tier, not a noindex flag.** `hidden` generates no route at
all; `listed` renders with `noindex, follow`; `indexed` enters the sitemap. A
noindex page is still crawled and still counts toward site-level quality, so
parking a thousand thin pages there is not free. 28 pages are `indexed` and the
remaining 976 are `hidden` — nothing sits at `listed`, so Google sees only the
written pages. `scoreContent` gates promotion and visibility only moves
forward.

**Keywords came from autocomplete, not intuition.** English head term is
`deepseek harness plugins` (plural), from Google. The first landing copy
contained it zero times, which is the classic silent-density failure. Homepage
now: 1,539 words, head term 7×, six FAQ questions verbatim from autocomplete
with FAQPage JSON-LD.

Chinese came from **Baidu** autocomplete, which returns a different set — head
term `DeepSeek Harness 插件`, secondaries `DSH 插件` and `插件大全`
(`deepseek插件大全列表` is a live suggestion). Two FAQ questions have no English
counterpart because nobody asks them in English: `社区插件有哪些` and `收费吗`.
Chinese homepage: 1,996 CJK characters, head term 10×, secondary 4×, all three
H2s carrying the head term. Noise to filter: `deepseek harness 招聘/面经/团队` is
job-seeker traffic, and `dhh插件`/`dz插件`/`dstwo插件` are unrelated products.

**The Chinese is written, not translated.** Product and ecosystem nouns stay in
English — DeepSeek Harness, DSH, topic, npm, Star, tarball, commit, agent —
because that is how Chinese developers type and search for them; 线束 is also
the homophone trap that ruins the query. Everything else is written the way a
Chinese developer writes. All 1,002 catalogue summaries were already bilingual
upstream, so no card is machine-translated.

## Not done

**Blocking on someone else**

- **npm Trusted Publisher (OIDC).** Configured correctly and refused anyway —
  see the trap below. `dsh-plugins-store` publishes through
  `scripts/publish.mjs` instead. Worth an npm support ticket; the evidence is
  precise. Also time-boxed: npm restricts bypass-2FA tokens for direct
  publishing from January 2027, so the current workaround has a deadline.
- **Rotate the npm token.** `NPM_TOKEN` in `dsh-plugins-store` was pasted into a
  chat transcript. Replace it and update the secret.
- **A staged `dshmarketplace-cli@0.1.6`** is sitting unapproved on npm from a
  control experiment. It cannot publish itself, but rejecting it needs an OTP:
  `npm stage reject 5b95be5d-066a-467c-8346-ef02e0435850`.

**Competitive position, as of 2026-08-17**

`dshmk.com` (`ZASENJC/dsh-plugins-store`, MIT, open source) shipped on LINUX DO
the same day. Read their source before building any of the below — the useful
parts are recorded, not guessed.

| | Them | Us |
| --- | --- | --- |
| Listings | 2,820 | 1,002 |
| Discovery | GitHub Search API, `dsh-plugin` **and** `deepseek-harness` topics, partitioned to beat the 1,000-result cap | CC0 registry seed plus one topic |
| Public API | `catalog.json`, one prerendered blob | `/api/v1/plugins`, filterable — **exists but is undocumented and unlinked** |
| npm | a DSH plugin (`npm:dsh-plugins-store`) | a CLI (`dshmarketplace-cli`) |
| Validation | real Docker sandbox, eight steps, network gated per phase, failure attributed to plugin vs infrastructure | heuristic README scan only |
| Per-plugin writing | none | bilingual overview, docs section, illustration |

What that implies, in order of effort against payoff:

1. **Document the API and link it.** It already exists; nobody knows. Cheapest
   possible win for distribution. `installable` and `install: null` are part of
   the contract now — a caller that runs whatever is in `install` must not be
   handed something that does not install. Both READMEs and the Python
   package's now document it; the site itself still does not link it.
2. **Add the `deepseek-harness` topic and partition the search.** Roughly
   doubles coverage, one script.
3. **A leaderboard.** `POST /api/v1/installs` is live and the in-DSH plugin
   reports into it, so `installCount` finally has a source. `plugin_stats`
   daily snapshots are still not running, so star velocity is not computable
   yet. The leaderboard page itself does not exist.
4. ~~**The in-DSH plugin.**~~ **Shipped**, now at `dshmarketplace-plugin@0.1.4`
   and verified in a real harness. `/store` in any session, a Settings →
   Plugins tab, and two agent tools with a bundled skill.
5. ~~**A Python client.**~~ **Shipped** as `dshmarketplace` on PyPI. Worth
   knowing: PyPI links are `rel=nofollow`, so this is distribution and brand
   presence, not link equity — measure a channel before investing in it.
6. ~~**A userscript.**~~ **Shipped** as
   [`dsh-plugin-radar`](https://greasyfork.org/scripts/591735-dsh-plugin-radar),
   script 591735. Same finding as PyPI, measured the same way — on our own
   listing page, the repo link in the description is dofollow and
   `dshmarketplace.dev` is `nofollow`, so Greasy Fork runs a trusted-domain
   allowlist. The equity arrives one hop later, via the repo's README.
7. **Real validation.** Most expensive; needs a Docker runner in CI, cannot run
   on Workers.

Depth stays the moat. Their listings are metadata; ours are written. Do not
trade that away chasing their feature list.

**UI — the next focus, and the current weak point**

The information architecture and the type are right; the surfaces are not. The
catalogue is still a flat card grid, the landing page is a stack of sections
with no rhythm, and nothing on any page rewards a second look. This is the next
body of work, and it is worth doing properly — the reference bar is
dshplugins.com, not the scaffold this started from. Constraints: the Foundry
palette and the CJK type rules in `CLAUDE.md` stay; no shadcn defaults; check
both languages after every type change.

**Content — started, ~986 plugins to go**

- Each written page carries a bilingual overview, a bilingual documentation
  section and an illustration. `pnpm tsx scripts/write-content.ts --limit 10
  --images` writes the next batch; `scripts/promote.ts --limit 10` moves them
  into the sitemap. Registry-reviewed plugins are picked first, because passing
  the community review is a better signal than a star count a repo may have
  earned for something else.
- The imported README is no longer rendered. It is the source the documentation
  section is written from, and it stays in the database, but showing it gave
  every page a wall of shields.io badges and 18 KB byte-identical to what every
  competitor scraped.
- Everything runs on an external gateway (`VELOKEY_API_KEY` in `.dev.vars`), so
  the batches do not consume the coding assistant's budget.
- Read the output before promoting. Two defects only surfaced on the rendered
  page: a monorepo entry titled "dsh", and README headings competing with the
  page's own outline.
- LINUX DO thread links: schema ready (`linuxdoUrl`), no data.

**Infrastructure**

- Sync is manual (`pnpm tsx scripts/sync-github.ts`). Needs a Worker on a cron
  trigger, plus the daily promote-ten-pages job that `promoteBatch()` already
  implements but nothing calls.
- Search is `LIKE`. Turso is SQLite, so FTS5 with bm25 is available and should
  replace it before the catalogue grows.
- No R2 incremental cache; ISR revalidation is not backed by anything durable.
- Admin is read-only. `setVisibility` and `saveOverview` exist as server
  actions with no UI wired to them.
- No `/collections`, no RSS, no newsletter beyond the form.
- Chinese pages have no Chinese category descriptions — `categories.description`
  is English-only and currently null for every row.

## Traps already hit

Each of these cost real time; they are recorded so they are not rediscovered.

- **pnpm's symlinked store breaks OpenNext's bundle copy.** `.npmrc` pins
  `node-linker=hoisted` for this reason.
- **Dependency tracing runs under Node, bundling runs under workerd.** Packages
  with a separate `workerd` export condition get traced to their Node file only.
  `next.config.mjs` force-includes `@libsql/isomorphic-ws` because of this.
- **Turso on Workers needs the `/web` entrypoints and lazy init.** Reading
  credentials at module scope throws during cold start on a healthy deploy.
- **The Worker size ceiling is real.** Getting under it meant removing twenty
  dependencies, twelve orphaned components and the auth middleware. Markdown is
  rendered during sync, not at request time, partly for this reason. Adding a
  heavy dependency will break the deploy.
- **npm rejected `dshmarketplace` as too similar to `dsh-marketplace`.** A 404
  from the registry means "not published", not "available". Published as
  `dshmarketplace-cli`; three probe names are published and deprecated.
- **A project-level `.npmrc` outranks `--userconfig`.** A stale token there
  caused a long misdiagnosis of an account 2FA policy.
- **`next/script` with `afterInteractive` did not inject on the dynamic
  homepage** while working on every prerendered page. GA is plain tags now.
- **`<html lang>` can only be set by a root layout.** Two languages therefore
  need two root layouts, via route groups `(en)` and `(zh)`. Cross-layout
  navigation is a full page load, which is why the language switch is an `<a>`.
- **`app/opengraph-image.jpg` silently stops working once `app/layout.tsx` is
  gone.** The convention resolves per segment and there is no shared segment
  above two root layouts. `og:image` vanished with no warning; social metadata
  is declared explicitly in `lib/social.ts` now.
- **An undefined CSS variable invalidates the whole `font-family`.** The CJK
  fallback is defined at `:root`, not under `:lang(zh)`, or every Latin page
  loses its font stack entirely.
- **Moving the scaffold's `app/favicon.ico` into `public/` reinstated it.** The
  tab icon was the template's. All rasters are now generated from
  `public/brand/mark.svg` by `scripts/build-brand.ts`.
- **Asking a model for Markdown inside JSON string values fails constantly.**
  One unescaped quote throws at a byte offset that names nothing. Generation
  uses `<<<MARKER>>>` blocks, and the parse sits inside the retry loop because
  the real failure is the model stopping after the English blocks.
- **Re-running the writer used to demote an indexed page back to `listed`,**
  quietly pulling it out of the sitemap as a side effect of improving its copy.
  Visibility now only ever moves forward.
- **`dsh plugin add` needs `--profile <name>`.** It forwards to pnpm inside a
  profile directory. Every install command on the site was missing it and
  installed nothing — the worst possible defect for a site whose pitch is
  "copy this command", and it survived because nothing had been run against a
  real harness.
- **`github:owner/repo#subpath` cannot install a monorepo plugin.** pnpm reads
  everything after `#` as a git ref. 54 listings carried a command that could
  not work; they now explain the alternative instead.
- **Installing from GitHub needs a build allowlist.** pnpm blocks a git-hosted
  package's `prepare` script until its key is added under `allowBuilds`. This
  is why npm is offered first — not because a tarball beats a clone.
- **Nothing about the DSH plugin API was discoverable by reading.** Five
  contract mismatches, each found only by booting the harness. See
  `docs/in-dsh-plugin.md`, which now records what is true rather than what was
  inferred.
- **The local HTTPS proxy caches responses, and cost three deploys.** Probing
  production for a change that was in fact live returned the previous body
  every time, which read exactly like a stale deploy — the version was at 100%,
  the commit was right, and a static page from the same commit was serving new
  content. Verify production with `curl --noproxy '*'`. Believing the first
  reading here nearly produced a second wrong diagnosis on top of a first.
- **`npm publish` cannot publish `dshmarketplace-plugin`, from anywhere.** Local
  and CI, granular token and Trusted Publishing's OIDC token, plus
  `npm stage publish` — all six refused with a bare `403 Forbidden - PUT` and no
  response body. A raw `PUT` of the same tarball to the same URL with the same
  token returns `{"success":true}`. `scripts/publish.mjs` in that repo does
  that, and CI runs it. Proven correct and not worth re-investigating: the
  trusted-publisher config (the OIDC exchange returns 201, which requires an
  exact match), package ownership, and 2FA — `npm dist-tag add` gets a normal
  EOTP challenge, and `npm stage publish` exists solely to defer the 2FA proof
  yet fails identically.
- **Producer/consumer drift is this project's recurring bug, and fixtures never
  catch it.** Twice now the catalogue changed its output and a client kept its
  old assumption: 1,002 install commands missing `--profile`, then the in-DSH
  plugin's own safety guard matching only `dsh plugin add …` and refusing every
  command the API actually sends — so every install in the store was rejected by
  its own check. Both were found by running against live data, which is why
  `dshmarketplace-py` ships opt-in live tests.
- **Cloudflare's rate-limit binding is far looser in production than locally.**
  At 5 requests/60s, `wrangler dev` refuses the 6th exactly; production took 34
  of a 40-request burst before the first 429, because counting is per-location
  and converges late. It raises the cost of a sustained attack; it does not cap
  attempts at the configured number. Do not describe it as if it does.

## Provenance

Scaffold derived from [9d8dev/directory](https://github.com/9d8dev/directory)
(MIT); catalogue seed from
[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
(CC0). Both credited in `NOTICE`. Independent project, not affiliated with
DeepSeek — stated on every page, and the brand mark shares nothing with theirs.
