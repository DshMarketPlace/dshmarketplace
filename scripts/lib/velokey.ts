/**
 * Clients for the two gateways behind the content pipeline.
 *
 * Text and images come from different providers because they failed at
 * different times: VELOKEY_* still answers chat completions, its image
 * endpoint stopped, and IMAGE_API_* took over the artwork. Keeping them
 * separate means one dying again only costs half the pipeline.
 */
import { config } from "dotenv";

// Scripts load `.env` through `dotenv/config`, but these keys belong in
// `.dev.vars` alongside the other secrets the Worker never sees. Loading it
// here means every caller gets them; relying on the caller left `--images`
// failing on a missing key that was in fact set.
config({ path: ".dev.vars", override: false });

const BASE = process.env.VELOKEY_BASE_URL ?? "https://api.velokey.ai";

function key(): string {
  const k = process.env.VELOKEY_API_KEY;
  if (!k) {
    throw new Error(
      "VELOKEY_API_KEY is not set. Add it to .dev.vars (which is gitignored) " +
        "or export it before running this script.",
    );
  }
  return k;
}

async function request(
  path: string,
  init?: RequestInit,
  endpoint?: { base: string; apiKey: string },
) {
  const res = await fetch(`${endpoint?.base ?? BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${endpoint?.apiKey ?? key()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}: ${body.slice(0, 400)}`);
  }
  return JSON.parse(body);
}

export type ChatOptions = {
  model?: string;
  system?: string;
  maxTokens?: number;
  /** Retries cover the gateway's occasional 5xx and truncated JSON. */
  retries?: number;
  /**
   * Another OpenAI-shaped gateway. The reviews run on a different provider
   * from the overviews, so one going down does not take both with it — the
   * same reason the image endpoint is separate.
   */
  endpoint?: { base: string; apiKey: string };
};

export async function chat(prompt: string, opts: ChatOptions = {}) {
  const {
    model = process.env.VELOKEY_TEXT_MODEL ?? "gpt-5.6-luna",
    system,
    maxTokens = 12000,
    retries = 3,
    endpoint,
  } = opts;

  const messages = [
    ...(system ? [{ role: "system", content: system }] : []),
    { role: "user", content: prompt },
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await request(
        "/v1/chat/completions",
        {
          method: "POST",
          body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
        },
        endpoint,
      );
      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (!text?.trim()) throw new Error("empty completion");
      return text;
    } catch (err) {
      lastError = err;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw lastError;
}

/**
 * Splits a `<<<MARKER>>>`-delimited response into named blocks.
 *
 * Deliberately not JSON. Asking a model for Markdown inside JSON string values
 * fails often and silently — an unescaped quote or a literal newline in a
 * 4 KB payload throws at a byte offset that tells you nothing. Markers cannot
 * collide with Markdown, so the parse either finds a block or reports which
 * one is missing by name.
 */
export function parseBlocks<K extends string>(
  text: string,
  keys: readonly K[],
): Record<K, string> {
  const out = {} as Record<K, string>;
  const missing: string[] = [];

  for (const key of keys) {
    const start = text.indexOf(`<<<${key}>>>`);
    if (start === -1) {
      missing.push(key);
      continue;
    }
    const from = start + key.length + 6;
    const next = text.slice(from).search(/<<<[A-Z_]+>>>/);
    out[key] = text.slice(from, next === -1 ? undefined : from + next).trim();
  }

  if (missing.length > 0) {
    throw new Error(
      `missing block(s): ${missing.join(", ")} — got: ${text.slice(0, 160)}`,
    );
  }
  return out;
}

/**
 * Chat plus block parsing, retried together.
 *
 * The failure that actually happens is not an HTTP error — it is the model
 * ending its turn after the English blocks and never emitting the Chinese
 * ones. Retrying the request is the only fix, so the parse has to sit inside
 * the retry loop rather than after it.
 */
export async function chatBlocks<K extends string>(
  prompt: string,
  keys: readonly K[],
  opts: ChatOptions = {},
): Promise<Record<K, string>> {
  const retries = opts.retries ?? 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Each retry asks for one attempt only, so a parse failure does not
      // multiply against the transport retries underneath it.
      const raw = await chat(
        attempt === 0
          ? prompt
          : `${prompt}\n\nIMPORTANT: your previous attempt stopped early. Emit ALL ${keys.length} marker blocks, in order, including every Chinese one.`,
        { ...opts, retries: 1 },
      );
      return parseBlocks(raw, keys);
    } catch (err) {
      lastError = err;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError;
}

/**
 * Images. OpenAI-shaped and synchronous: one POST returns the image, either
 * inline as `b64_json` or as a hosted `url`, and it honours the requested size
 * — the previous gateway queued a task, had to be polled, normalised
 * everything to a square, and eventually stopped answering.
 */
export async function generateImageSync(
  prompt: string,
  opts: { size?: string; model?: string } = {},
): Promise<Buffer> {
  const base = process.env.IMAGE_API_BASE;
  const key = process.env.IMAGE_API_KEY;
  if (!base || !key) {
    throw new Error("IMAGE_API_BASE and IMAGE_API_KEY must be set in .dev.vars");
  }

  const res = await fetch(`${base}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? process.env.IMAGE_MODEL ?? "gpt-image-2",
      prompt,
      n: 1,
      size: opts.size ?? "1536x1024",
    }),
  });

  if (!res.ok) {
    throw new Error(`images/generations → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = await res.json();
  const first = data?.data?.[0];
  if (first?.b64_json) return Buffer.from(first.b64_json, "base64");

  // The gateway may answer with a hosted URL instead. Both are valid for this
  // endpoint and it has switched between them without notice, so handle both
  // rather than pinning `response_format` and trusting it to be honoured.
  if (first?.url) {
    const img = await fetch(first.url);
    if (!img.ok) throw new Error(`image url → ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }

  throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 200)}`);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
