import { NextResponse } from "next/server";

import { handleMcp, rpcError } from "@/lib/mcp";

/**
 * MCP over Streamable HTTP, stateless: POST a JSON-RPC message, get JSON back.
 * No server-initiated stream, so GET is refused as the transport allows.
 * Open to any origin — it is read-only, holds no session and no credentials.
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version, mcp-session-id, authorization",
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }
  const answer = await handleMcp(body);
  // Only notifications in the body: accepted, nothing to say.
  if (answer === undefined) return new Response(null, { status: 202, headers: CORS });
  return NextResponse.json(answer, { headers: { ...CORS, "Cache-Control": "no-store" } });
}

export function GET() {
  return new Response("This MCP server answers POST only (stateless Streamable HTTP).", {
    status: 405,
    headers: { ...CORS, Allow: "POST, OPTIONS" },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
