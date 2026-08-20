@AGENTS.md

# dshmarketplace.dev

A bilingual directory of DeepSeek Harness (DSH) plugins. English at `/`,
Chinese at `/zh`. Live at <https://dshmarketplace.dev>, on Cloudflare Workers.

Four documents, and they do not overlap:

- **This file** — the design rules. Read it before changing anything.
- **`CONTRIBUTING.md`** — which scripts are destructive, what must run before
  them, and what looks like an improvement but is not. Read it before running
  anything in `scripts/`.
- **`ops/README.md`** — what runs where, the CI credential boundary, the VPS.
- **`STATUS.md`** — the live inventory and the full trap list.

## The one thing to understand first

Sixteen directories already index DSH plugins — one search pass found them, and
found that we appeared in none of those results. All of them are card walls
that link straight out to GitHub. **The only differentiator is written depth**:
a page per plugin carrying an overview, a documentation section and an
illustration that a scraper cannot produce.

Every decision below follows from that. When a change would make the site
faster to build but thinner to read, it is the wrong change.

## Architecture

```
app/(en)/            English routes — root layout sets lang="en"
app/(zh)/zh/         Chinese routes — root layout sets lang="zh-Hans"
components/views/    The actual pages, locale-parameterised, shared by both
lib/dict.ts          Every visible string, both languages
lib/i18n.ts          Locale type, path helpers, hreflang, relative dates
db/schema.ts         plugins, categories, plugin_stats, submissions
scripts/             Author-time jobs: seed, sync, write-content, promote
```

Route files are thin: they set metadata and render a view from
`components/views/`. Put logic in the view, never in the route.

`/` is the landing page. `/plugins` is the catalogue. Keep them apart — they
were one page once, and a query string silently turned the homepage into a
different page under the same canonical.

## Hard constraints

Violating any of these breaks the deploy or the data, not just the build.

1. **The Worker size ceiling is the binding constraint.** Getting under it cost
   twenty dependencies, twelve components and the auth middleware. Do not add a
   dependency without checking the bundle. Prefer a hand-rolled twenty lines.
2. **Markdown is rendered at author time, never at request time.** `marked` and
   `sanitize-html` must not reach the Worker. Sync writes `*Html` columns.
3. **Turso needs the `/web` entrypoints and lazy client init.** Reading
   credentials at module scope throws on cold start.
4. **Dependency tracing runs under Node, bundling under workerd.** A package
   with a separate `workerd` export condition needs an entry in
   `outputFileTracingIncludes`.
5. **`<html lang>` can only be set by a root layout**, hence two of them. Any
   new page must live under `(en)` or `(zh)`. There is no shared segment above
   them, so `app/favicon.ico` and `app/opengraph-image.jpg` conventions do not
   work — icons and social cards are declared in `lib/social.ts`.
6. **An undefined CSS variable invalidates the whole declaration.**
   `--font-cjk` is defined at `:root` for this reason. Do not move it.

## DSH itself

Facts about the harness that cost real time to find. `docs/in-dsh-plugin.md`
has the full set.

- **`dsh plugin` forwards to pnpm inside a profile directory**, so
  `--profile <name>` is mandatory. Without it nothing installs. Every command
  the site emits carries `--profile web`.
- **`github:owner/repo#subpath` fails, but a subpath install is possible.**
  This file asserted the opposite until 19 Aug 2026, when an install disproved
  it. The bare form is read as a git ref and fails with `Could not resolve
  <sub> to a commit`, which is where the belief came from. pnpm's own parser
  splits the fragment on `::` and treats a `path:` part as a subdirectory, so
  `github:owner/repo#path:sub` resolves — verified end to end in the sandbox
  (`+ dsh-pet github:PC2005-cloud/dsh-pet#path:dsh-pet`, 9.2s), with and
  without a leading slash. `lib/install.ts` still emits no command for these,
  which is now an understatement rather than a fact: **54 listings say no
  install exists when one does**, including the two highest-starred in the
  catalogue. Before switching it on, validate the `subpath` column — two of
  the first three tested pointed at directories that do not exist in the repo,
  so the stored value is not trustworthy on its own.
- **A GitHub install runs the project's build script**, which pnpm blocks
  until it is allowlisted. That, not download size, is why npm is offered
  first.
- **`dsh plugin add` takes several targets at once.** `add a b c` installs and
  registers all three in one pnpm resolution — verified, five plugins in 3.5s.
  This is what makes a cart or a preset a single command rather than a loop.
- **An aggregate package works, through the patch layer, not through
  `bundles`.** A package whose `dependencies` are plugins and whose own
  `cordis.patch.yml` inserts a row per dependency activates all of them; only
  the directly-added package appears in `dsh.profile.bundles`. It works because
  the profile's `pnpm-workspace.yaml` sets `nodeLinker: hoisted`, so the
  dependencies resolve from the profile root. `@deepseek-ai/dsh-base` is built
  this way, and so is `dsh-kit`. A meta-package with no `patch` is not a bundle
  at all and the harness says so.
- **The pnpm version changes the verdict.** pnpm 11 exits non-zero on
  `ERR_PNPM_IGNORED_BUILDS`, `dsh` reads that as a failed install and stops
  before writing the bundle row, so a plugin with a blocked build script is
  `needs-approval` on 11 and `passed` on 10. The sandbox pins 10 — and did not
  actually pin it until 20 Aug, because `corepack prepare` ran as root while
  the container runs as `node`, so every run silently downloaded latest.
  **The 2,426 recorded verdicts were produced under 11 and are conservative.**
- **A blocked build script is fixed by `onlyBuiltDependencies` in the
  profile's `pnpm-workspace.yaml`**, followed by a reinstall. Verified on
  `dsh-better-sidebar`: node-pty blocked, allowlisted, node-gyp built it,
  registered. `dshmarketplace-cli` does this automatically.
- **Nothing about the plugin API is discoverable by reading.** Boot the
  harness; its errors name the missing field precisely.

## Publishing

Five surfaces read one API — the site, `dshmarketplace-cli` (npm),
`dshmarketplace` (PyPI), `dshmarketplace-plugin` (npm) and the
`dsh-plugin-radar` userscript. Two rules follow.

**When the API's output changes, re-run every client against live data.** This
project's recurring bug is producer/consumer drift, and fixtures have never
caught it: 1,002 install commands missing `--profile`, then the in-DSH plugin's
own safety guard refusing every command the API actually sends. The Python
package's `pytest -m live` exists for this; run it after any change to
`lib/install.ts` or the API shape. `/api/v1/index` is `force-dynamic` for the
same reason — `promote.ts` and `sync-github.ts` write without a deploy, so a
prerendered copy would drift from `/api/v1/plugins`.

**Publishing works; which path depends on the package.** `npm publish` is fine
for `dshmarketplace-cli` — 0.2.0 and 0.3.0 went out that way on 20 Aug.
`dshmarketplace-plugin` is refused with a bare 403 and publishes from CI via
`scripts/publish.mjs`, a raw `PUT` of the same tarball; tag `v<version>` and
push, or run the workflow. The full investigation is in that workflow's
comments — **read it before touching this, do not re-derive it.**

The cause named there also governs everything else: `NPM_TOKEN` is a granular
token with Bypass 2FA, and npm restricts those. Publishing survives;
**deletions do not** — `npm dist-tag rm` returns `403 Granular access tokens
that bypass two-factor authentication may not perform this action`, and needs
`--otp`. The restriction widens in January 2027.

Packages are owned by the npm account `leofenn`. A token from any other account
403s on everything, which is a different failure wearing the same status code.

## What gets listed, and what gets claimed

**The admission bar is published, so it can be checked.** `ingest-topic.ts`
admits a repository only with a DSH plugin marker, ten commits or more, and a
description. The commit number is `awesome-dsh-plugin`'s, not ours, so the
standard is checkable against someone else's rules. `/api-docs` states all
three. A filter nobody can check is not a filter.

**Never claim a plugin is broken on evidence weaker than an install.** The
sandbox distinguishes `passed`, `needs-approval`, `not-a-layer`, `failed` and
`timeout`, and only the last two are defects. Of 410 "failures" in the first
full batch, 366 were our own bad npm data and 18 more were a probe change made
mid-run. Reading the code has now twice failed to catch commands that cannot
run, and installing them caught both.

**A catch-all verdict collects things that do not belong together.** `failed`
was the branch nothing else matched, so it accumulated three unrelated
populations: a 429 from `codeload.github.com` (a source install downloads its
tarball from GitHub, which rate limits too), a package the harness deliberately
took as a plain dependency because it declares no `dsh.bundle`, and genuine
packaging defects. Only the third is publishable, and it was 21 of 59. When one
detail string covers dozens of unrelated repositories, that uniformity is the
bug — split the bucket before believing it.

**A name in `package.json` proves nothing.** It is an intention, and it is not
even evidence of intent when the repo is a fork, which inherits the upstream's
manifest wholesale. 412 of 852 npm claims were wrong: 362 named a package that
was never published, and 50 named somebody else's — installing them fetched a
stranger's code, which then "failed" in our sandbox under the listed author's
name. `repair-npm-claims.ts` checks existence *and* ownership across the whole
catalogue; `sync-github.ts` only checks the rows it happens to refresh.
Ownership means the **owner** matches, not the repo — authors rename
repositories, and treating that as a collision retracts working commands.

**A verdict belongs to the command that was run.** `apply-validations.ts`
drops any result whose install command no longer matches what the listing
publishes. A batch takes hours, and the catalogue changes underneath it.

**The harness is not a plugin.** `deepseek-ai/deepseek-harness` carries the
topic and every marker a plugin does, has two orders of magnitude more stars
than anything else, and the sandbox passes it — installing the harness into a
profile does technically work. It still sat at the top of the catalogue telling
readers to install it, and then the review told them not to. `IS_A_HOST` in
`ingest-topic.ts` rejects hosts by name.

**And that fix has never applied to the two rows that caused it.** `IS_A_HOST`
gates admission, so it stops new arrivals and did nothing about
`deepseek-ai/deepseek-harness` (151,755 stars) and `sandbaseai/sandbase-harness`,
both still present, both `visibility: "hidden"` — which only suppresses the
detail page. Browse and the API show every tier, so the harness is still the
first card in the catalogue, and the cart will happily put it in a command.
This is the scope bug in its usual costume: a correct rule aimed at the wrong
set of rows. **Removing them needs a decision, not a script** — that is the one
class of change this project confirms before running.

**No verdict is publishable unless it is about us being right.** Four separate
checks now refuse to publish a measurement: a registry 429 (that measures our
traffic), a command that changed since the run, a probe with no verdict, and a
review section that admits it has nothing to say. Each was added after the
thing it prevents had already reached the live site.

**The AI review judges fit, never people.** It is labelled as generated, says
which parts were observed in a real install and which were read off the repo,
and never uses our own heuristic risk flags as a stick. When the sandbox says a
plugin does not install, `verdictConstraint()` forbids recommending it — in
code, because that is not a judgement call. Regenerate with `--force` after any
prompt change.

## Content rules

**A preset is a stronger claim than a listing, so it needs stronger evidence.**
A listing's verdict comes from installing that plugin into an empty profile. A
preset says its members work *together*, and combinations fail where the parts
do not: incompatible peers, a build script blocked only once another plugin
drags in its owner, and cordis rejecting a duplicate loader entry id so a
plugin installs, reports success and is never registered. `preset.mjs` in the
validator installs the whole list as one command and requires every member to
appear in the profile's bundles. `lib/presets.ts` carries the date, verdict and
the `dsh`/`pnpm` versions of that run. **There is no field for "we think this
is fine", and a set that quietly drops a member is worse than no set** — the
reader believes they have a capability they do not have.

**The cart offers our command first and the raw one underneath.** `npx
dshmarketplace-cli add a b c` earns its place by reading the profile the
harness actually created, skipping what the sandbox could not install, and
allowlisting a blocked build script. Hiding `dsh plugin add` would be the
opposite of the point of this catalogue; both are shown, with the reason.

**Visibility is three-tier.** `hidden` generates no route at all; `listed`
renders `noindex, follow`; `indexed` enters the sitemap. `scoreContent` gates
promotion — a page with no writing of its own tops out at 20 against a
threshold of 70. Never bypass it. Never demote a page as a side effect.

**Keywords come from autocomplete, never from intuition.** English from Google,
Chinese from Baidu — they return different sets. Head terms: `deepseek harness
plugins` and `DeepSeek Harness 插件`. Audit the *rendered* page, never the JSX:
density, canonical and a missing robots tag are all invisible in source.

**The Chinese is written, not translated.**

- Product and ecosystem nouns stay in English: DeepSeek Harness, DSH, topic,
  npm, GitHub, Star, tarball, commit, agent, token, API. So does every command,
  file name, flag and config key. Chinese developers search for them in English,
  and 线束 is the homophone that poisons the query.
- Everything else is written the way a Chinese developer writes.
  「装之前先看一眼」, not「安装前请仔细阅读」. No 让您 / 轻松 / 强大 / 赋能 /
  一站式. No emoji.
- Never machine-translate an English string into `lib/dict.ts`. If you cannot
  write the Chinese, say so rather than filling the slot.

**Never claim what the source does not establish.** The generator is told this
explicitly; hold the same line by hand. No invented config keys, defaults,
benchmarks or limitations.

## Design

The direction is "Foundry": warm ink on paper, one molten-copper accent,
letterpress rules, no rounded pill shapes, no drop shadows.

- OKLCH throughout, defined in `app/globals.css`. **No pure black, no pure
  white.** Every neutral is tinted toward the copper hue — that shared warmth is
  what stops a two-colour palette reading as greyscale.
- Type: Bricolage Grotesque for display, Geist for body, Geist Mono for every
  identifier. Monospace is semantic here, not decorative.
- Borders and hairline rules do the structural work that shadows would do
  elsewhere. Grids are `gap-px` over a `bg-border` parent.
- **CJK needs its own treatment.** Latin tracking of `-0.035em` collides on
  full-width glyphs; weight 800 gets synthesised and smears. `:lang(zh)` resets
  tracking, drops to 700 and enlarges leading. Check both languages after any
  type change.
- Do not introduce shadcn defaults. The scaffold's look was rejected once
  already.

## Workflows

```bash
pnpm dev                                          # localhost:3177 — 3000 is taken
pnpm build                                        # must pass before any push

pnpm tsx scripts/sync-github.ts                   # refresh GitHub metadata
pnpm tsx scripts/repair-npm-claims.ts --dry       # audit every npm claim, whole catalogue
pnpm tsx scripts/export-validation-specs.ts > /tmp/specs.jsonl   # → sandbox on `oracle`
pnpm tsx scripts/apply-validations.ts /tmp/results.jsonl
pnpm tsx scripts/write-review.ts --limit 10 [--force]
pnpm tsx scripts/write-content.ts --limit 10 --images
pnpm tsx scripts/promote.ts --limit 10            # move into the sitemap
pnpm tsx scripts/repair-content.ts --all          # re-render and rescore after a rule change

# In the validator repo — a preset is verified as a combination, not a list:
docker run --rm --entrypoint node dsh-validator:latest \
  /usr/local/bin/preset.mjs "essentials" pkg-a pkg-b pkg-c
pnpm tsx scripts/build-brand.ts                   # icons + social cards from mark.svg
```

Content generation runs on the user's own gateway (`VELOKEY_API_KEY` in
`.dev.vars`), so it does not consume the assistant's budget.

**Always read the rendered page before promoting a batch.** The two real
defects so far — a plugin titled "dsh", README headings competing with the page
outline — were invisible in the generated text and obvious on the page.

Push to `main` deploys automatically (~80 s). Never commit `.dev.vars`.

## Conventions

- No new dependencies without a stated reason and a bundle check.
- No `any`. No `console.log` left in app code — scripts may log.
- Comments explain *why*, never *what*. If a line needs a comment to say what it
  does, rewrite the line.
- Every user-visible string goes through `lib/dict.ts`. No literals in JSX.
- New route → add it to `app/sitemap.ts` and give it `alternatesFor()`.
