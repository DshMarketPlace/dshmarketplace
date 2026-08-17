# The in-DSH plugin — verified API notes

Shipped as `dshmarketplace-plugin`, running in a real harness. This file is now
a record of **what the API actually is**, corrected against `dsh 0.1.0-rc.6`.

The first version of this file was written by reading a competitor's source.
Every structural fact in it was right and every behavioural one was wrong —
five contract mismatches only surfaced by booting DSH. If a future version of
DSH breaks the plugin, **boot it and read the error**; the errors are precise
and name the missing field. Do not infer.

Corrected below, with the failure each one produced.

## The manifest

A DSH plugin is an npm package with a `dsh` key in `package.json`:

```jsonc
{
  "type": "module",
  "main": "./lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js",
    "./package.json": "./package.json"
  },
  "files": ["lib", "skills", "cordis.patch.yml", "README.md", "LICENSE"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-slots",
        "@deepseek-ai/dsh-client-ui-commands",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-primitives",
        "@deepseek-ai/dsh-client-ui-settings",
        "@deepseek-ai/dsh-client-ui-settings-plugins"
      ]
    }
  },
  "peerDependencies": { "@deepseek-ai/dsh-native-command": "^0.1.0-rc.6" },
  "engines": { "node": ">=22" }
}
```

`cordis.patch.yml` registers the plugin with the kernel:

```yaml
- insert:
    - id: plugin-store
      name: dsh-plugins-store
```

## The five corrections

| What was assumed | What it is | Failure it produced |
| --- | --- | --- |
| A tool is `{name, description, parameters, execute}` | It must also declare `output: { schema, render, presentationMeta? }`, and the runtime **validates the returned value** against that schema | `tool "…" must declare output { schema, render, presentationMeta? }` |
| A skill is `{name, content}` | It needs a kebab-case `name` and a **non-empty `description`**; `invocation` defaults if omitted | `Cannot read properties of undefined (reading 'length')` — takes down the whole plugin tree at boot |
| `webServer` handlers are `Request → Response` | They are Node's `(req, res)`. Returning a Response does nothing | The request hangs forever, no error |
| A client bundle is a plain script | It must announce itself: `window.__ModuleLoader__.load({ id, factory })`, `id` matching the package name | `loaded without registering "…" via __ModuleLoader__.load` |
| `runNativeCommand({command, args, signal})`, returns `{exitCode}` | `runNativeCommand(command, args, signal)`, **rejects** on non-zero exit | Silent — the success path never ran |

Two more found while using it:

- **Locale** is `ctx.locale.getSnapshot().active` plus `subscribe(fn)`, not a
  `current()` accessor. Guessing it fails silently and serves English to a
  mostly Chinese audience — read it through `useSyncExternalStore`.
- **A shared module that touches `process.env` at module scope** takes the
  browser bundle down with `process is not defined`. Pure helpers live in
  `src/shared.js`, which stays Node-free.

## Two entry points

**Host side** — `lib/index.js`, runs in Node:

```js
export const name = "dshmarketplace-plugin"
export const inject = ["commands", "webServer", "tools", "skills"]

export function apply(ctx) {
  ctx.commands.register({ name: "store", description: "...", handler })
  for (const tool of createTools()) ctx.tools.register(tool)   // defineTool
  ctx.on("tools/pre-execute", approvalGate)   // the risk confirmation
  ctx.skills.register(skill)
  ctx.webServer.register({
    kind: "exact",
    path: "/api/.../install",
    handler: (req, res) => { /* Node style */ },
  })
}
```

Use `defineTool` from `@deepseek-ai/dsh-tools`; `parameters` is a friendly map
of `name → {type, required, description}`, not a JSON Schema wrapper.

`ctx.webServer` is how the browser half talks to the host half. Actual installs
shell out via `runNativeCommand` from `@deepseek-ai/dsh-native-command` — and
the argv must be `["plugin", "--profile", <name>, "add", <target>]`, because
`dsh plugin` forwards to pnpm inside a profile directory and refuses to run
without the flag. There is no environment variable naming the booted profile;
derive it from the plugin's own path under `$DSH_HOME/profiles/<name>/`.

**Client side** — `lib/client.js`, runs in the browser:

```js
export const inject = ["slots", "locale", "sessions", "workspaces"]

export function apply(ctx) {
  ctx.locale.register(NS, { zh, en })
  ctx.on("command/executed", (sessionId, name, result) => { /* open on /store */ })

  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay", id: "...", order: 40, locale: NS, inject: () => deps,
  }, OverlayComponent))

  ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
    name: "settings.plugins.tab", id: "...", order: 20, label: () => t("..."),
  }, SettingsTabComponent))
}
```

Known slot names: `shell.overlay`, `settings.plugins.tab`. A conversation
surface exists in their feature list; the slot name for it is not confirmed
from source and needs checking before it is claimed.

## Build constraints

esbuild, two bundles:

| | format | platform | target | externals |
| --- | --- | --- | --- | --- |
| `index.js` | esm | node | node22 | `@deepseek-ai/dsh-native-command` |
| `client.js` | **cjs** | browser | chrome120 | **only** `react`, `@deepseek-ai/dsh-client-ui-primitives` |

The browser bundle's external list is a hard allowlist — their build fails the
pack if any other `require()` survives. Worth copying that check: it turns a
runtime failure inside someone's harness into a build failure on our machine.

## What ours does differently

Not a second copy of anyone's store. The plugin exists to put *our* catalogue
where the user already is, and the catalogue has things others do not:

- **Written detail pages, bilingual.** Other listings are metadata; ours carry
  an overview, a documentation section and an illustration.
- **One source.** The site, the CLI and this plugin all read
  `/api/v1/plugins`, so a listing cannot say one thing in a browser and another
  inside the harness.
- **Install counts.** The plugin is the only surface that can report a real
  install — the one ranking signal nobody can scrape. Reported host-side after
  success, one field, no identifiers, `DSHM_NO_TELEMETRY=1` to disable.
- **Risk flags gate the install**, on the UI path and the agent path alike.

## Still open

- The conversation-surface slot name is unconfirmed. Only `shell.overlay` and
  `settings.plugins.tab` are verified.
- A GitHub-sourced install fails until the user allowlists the build script
  under `allowBuilds`; the plugin explains it but cannot do it for them.
- DSH is a developer preview. Re-verify against the current version before
  assuming any of the above still holds.
