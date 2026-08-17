import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { plugins } from "@/db/schema";

export const dynamic = "force-dynamic";

/**
 * Counts an install.
 *
 * This is the one ranking signal a competitor cannot scrape — star counts are
 * public, real install numbers are not. It is also the only thing the in-DSH
 * plugin ever sends anywhere, so the contract is deliberately one field: a
 * plugin's public identifier. Nothing here reads or stores an IP, a session, a
 * machine id or a query.
 *
 * The count is advisory, not accounting. A missing row is a 404 rather than an
 * insert, so an install of something we do not list cannot create a listing.
 */
export async function POST(request: Request) {
  let body: { fullName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim() : "";

  if (!fullName || fullName.length > 300) {
    return NextResponse.json(
      { error: "fullName is required." },
      { status: 400 },
    );
  }

  const result = await db
    .update(plugins)
    .set({ installCount: sql`${plugins.installCount} + 1` })
    .where(eq(plugins.fullName, fullName));

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not in the catalogue." }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
