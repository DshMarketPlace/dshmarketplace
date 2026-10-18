/**
 * The catalogue as an MCP server — the sixth surface on the same API.
 *
 * Stateless Streamable HTTP: every POST carries one JSON-RPC message (or a
 * batch) and gets a JSON answer; there is no session and no server-to-client
 * stream, which the transport allows and which keeps this a plain route on a
 * Worker. Hand-rolled because the Worker's size ceiling is the binding
 * constraint and an SDK would be the largest thing in it.
 *
 * Read-only. Every answer comes from the same functions as /api/v1, through
 * the same record, so an agent is never told something a script is not.
 */
import { getAllCategories, getPlugins } from "@/lib/data";
import { pluginRecord } from "@/lib/plugin-record";
import { getPresetsWithPlugins, presetCommand, presetCliCommand } from "@/lib/presets";
import { directory } from "@/directory.config";

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER = { name: "dshmarketplace", version: "1.0.0" };

const INSTRUCTIONS = `Find and install DeepSeek Harness (DSH) plugins from ${directory.baseUrl}.
Every install command in this catalogue was run in a throwaway sandbox; installCheck says what happened (passed, needs-approval, not-a-layer, failed, timeout, incompatible) and installCheckDsh which dsh it ran on.
From dsh 0.2 the harness refuses a plugin whose dsh range does not cover the running version ("incompatible"); installFallback then names an older release that installed. Prefer "npx dshmarketplace-cli add <fullName>", which reads the local dsh version and picks a release it accepts.
Commands install into the "web" profile; change --profile if the user runs another. Show the user the command and its risk flags before running anything.`;

type Message = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, boolean>;
  run: (args: Record<string, unknown>) => Promise<unknown>;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** The fields an agent needs to choose, without the long tail of the record. */
function brief(p: ReturnType<typeof pluginRecord>) {
  return {
    fullName: p.fullName,
    summary: p.summary,
    category: p.category,
    stars: p.stars,
    install: p.install,
    installCheck: p.installCheck,
    installCheckDsh: p.installCheckDsh,
    installFallback: p.installFallback,
    riskFlags: p.riskFlags,
    url: p.url,
  };
}

async function findPlugin(name: string) {
  const { plugins } = await getPlugins({ q: name, sort: "stars", perPage: 24 });
  const exact = plugins.find(
    (p) => p.fullName.toLowerCase() === name.toLowerCase() || p.npmPackage === name,
  );
  return exact ?? plugins[0] ?? null;
}

const TOOLS: Tool[] = [
  {
    name: "search_plugins",
    description:
      "Search the DeepSeek Harness plugin catalogue by capability or name, most-starred first. Returns each plugin's install command and what happened when the sandbox ran it.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Capability or name, e.g. 'memory', 'vision', 'sidebar'." },
        category: { type: "string", description: "A category id from list_categories." },
        verified_only: {
          type: "boolean",
          description: "Only plugins whose command installed cleanly in the sandbox (installCheck = passed).",
        },
        limit: { type: "integer", minimum: 1, maximum: 25, description: "Default 10." },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async run(args: Record<string, unknown>) {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
      const { plugins, total } = await getPlugins({
        q: str(args.query),
        category: str(args.category),
        installCheck: args.verified_only === true ? "passed" : undefined,
        sort: "stars",
        perPage: 24,
      });
      return { total, results: plugins.slice(0, limit).map((p) => brief(pluginRecord(p))) };
    },
  },
  {
    name: "get_plugin",
    description:
      "Everything the catalogue knows about one plugin: summary, every install option, the sandbox verdict and the dsh it ran on, the fallback release when dsh refused the latest, blocked build scripts and risk flags.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "owner/repo, or the npm package name." },
      },
      required: ["name"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async run(args: Record<string, unknown>) {
      const name = str(args.name);
      if (!name) throw new ToolError("name is required");
      const p = await findPlugin(name);
      if (!p) throw new ToolError(`No plugin matches '${name}'.`);
      return pluginRecord(p);
    },
  },
  {
    name: "install_command",
    description:
      "The command to install one plugin, chosen from what the sandbox measured: the catalogue command, a pinned older release when dsh refused the latest, and the dshmarketplace-cli command that fits the release to whatever dsh the user runs.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "owner/repo, or the npm package name." },
        profile: { type: "string", description: "DSH profile to install into. Default 'web'." },
      },
      required: ["name"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async run(args: Record<string, unknown>) {
      const name = str(args.name);
      if (!name) throw new ToolError("name is required");
      const profile = str(args.profile)?.replace(/[^\w.-]/g, "") || "web";
      const p = await findPlugin(name);
      if (!p) throw new ToolError(`No plugin matches '${name}'.`);
      const r = pluginRecord(p);
      const withProfile = (cmd: string | null) =>
        cmd ? cmd.replace("--profile web", `--profile ${profile}`) : null;
      const fallback = r.installFallback as { version: string | null; status: string } | null;
      const pinned =
        r.installCheck === "incompatible" && fallback?.status === "passed" && r.npmPackage && fallback.version
          ? `dsh plugin --profile ${profile} add ${r.npmPackage}@${fallback.version}`
          : null;
      return {
        fullName: r.fullName,
        recommended: `npx dshmarketplace-cli add ${r.fullName} --profile ${profile}`,
        command: withProfile(r.install),
        pinnedForDsh: pinned ? { dsh: r.installCheckDsh, command: pinned } : null,
        installCheck: r.installCheck,
        installCheckDsh: r.installCheckDsh,
        blockedBuilds: r.blockedBuilds,
        riskFlags: r.riskFlags,
        note:
          r.installCheck === "incompatible"
            ? "dsh refused the latest release on the version we ran. The recommended command picks a release the local dsh accepts; pinnedForDsh is the one that installed in our sandbox."
            : r.installCheck === "needs-approval"
              ? "pnpm blocks a build script until it is allowlisted; the recommended command does that step."
              : r.installCheck === "failed" || r.installCheck === "timeout"
                ? "This command did not install in our sandbox. Tell the user before running it."
                : null,
        url: r.url,
      };
    },
  },
  {
    name: "list_categories",
    description: "The catalogue's category ids and names, for search_plugins' category filter.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async run() {
      const cats = await getAllCategories();
      return cats.map((c) => ({ id: c.id, name: c.name, nameZh: c.nameZh }));
    },
  },
  {
    name: "list_presets",
    description:
      "Curated plugin sets, each installed together as one command in the sandbox, with the dsh versions it was verified on and the command to install the whole set.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
    async run() {
      const { presets } = await getPresetsWithPlugins();
      return presets.map((p) => ({
        id: p.id,
        name: p.name.en,
        blurb: p.blurb.en,
        plugins: p.plugins,
        verified: p.verified,
        install: presetCliCommand(p),
        installManual: presetCommand(p),
      }));
    },
  },
];

class ToolError extends Error {}

function rpcError(id: Message["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handle(msg: Message): Promise<unknown> {
  if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return rpcError(msg?.id, -32600, "Invalid Request");
  }
  // A notification has no id and gets no answer.
  const isNotification = !("id" in msg);
  const { id, method, params = {} } = msg;

  switch (method) {
    case "initialize": {
      const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER,
          instructions: INSTRUCTIONS,
        },
      };
    }
    case "ping":
      return isNotification ? undefined : { jsonrpc: "2.0", id: id ?? null, result: {} };
    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({
            name,
            description,
            inputSchema,
            annotations,
          })),
        },
      };
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${String(params.name)}`);
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      try {
        const out = await tool.run(args);
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          result: { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], isError: false },
        };
      } catch (err) {
        // A tool that failed answers as a result, so the model can read why;
        // only a protocol fault is a JSON-RPC error.
        const message = err instanceof ToolError ? err.message : "The catalogue could not answer.";
        return {
          jsonrpc: "2.0",
          id: id ?? null,
          result: { content: [{ type: "text", text: message }], isError: true },
        };
      }
    }
    default:
      if (isNotification) return undefined;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** One POST body: a message or a batch. Undefined means "nothing to send back". */
export async function handleMcp(body: unknown): Promise<unknown> {
  if (Array.isArray(body)) {
    if (!body.length) return rpcError(null, -32600, "Invalid Request");
    const answers = (await Promise.all(body.map((m) => handle(m as Message)))).filter(
      (a) => a !== undefined,
    );
    return answers.length ? answers : undefined;
  }
  return handle(body as Message);
}

export { rpcError };
