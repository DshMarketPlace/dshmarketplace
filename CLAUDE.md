@AGENTS.md

# dshmarketplace.dev

A bilingual directory of DeepSeek Harness (DSH) plugins. English at `/`,
Chinese at `/zh`. Live at <https://dshmarketplace.dev>, on Cloudflare Workers.

`STATUS.md` holds the live inventory and the full trap list. This file holds
the rules — read it before changing anything.

## The one thing to understand first

Six or more directories already index DSH plugins. All of them are card walls
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
- **`github:owner/repo#subpath` cannot work** — pnpm reads everything after
  `#` as a git ref. Monorepo plugins with no npm package have no one-line
  install, and the listing says so rather than printing a command that fails.
- **A GitHub install runs the project's build script**, which pnpm blocks
  until it is allowlisted. That, not download size, is why npm is offered
  first.
- **Nothing about the plugin API is discoverable by reading.** Boot the
  harness; its errors name the missing field precisely.

## Content rules

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
pnpm tsx scripts/write-content.ts --limit 10 --images
pnpm tsx scripts/promote.ts --limit 10            # move into the sitemap
pnpm tsx scripts/repair-content.ts --all          # re-render after a rule change
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
