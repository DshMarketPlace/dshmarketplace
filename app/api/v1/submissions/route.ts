import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { submissions } from "@/db/schema";
import { inspectRepo, parseRepoUrl } from "@/lib/github-inspect";

export const dynamic = "force-dynamic";

/**
 * Repository inspection and submission share one endpoint, split by `action`,
 * because they run the same validation — inspecting is submitting without the
 * write. Everything lands as `pending`; nothing here publishes a listing.
 */
export async function POST(request: Request) {
  let body: { action?: string; url?: string; note?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json(
      { error: "A repository URL is required." },
      { status: 400 },
    );
  }

  const result = await inspectRepo(url);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (body.action === "inspect") {
    return NextResponse.json({ repo: result.repo });
  }

  const parsed = parseRepoUrl(url)!;
  const canonical = `https://github.com/${parsed.owner}/${parsed.repo}`;

  // Submitting the same repository twice is a duplicate, not an error worth
  // making someone feel bad about.
  const existing = await db
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(eq(submissions.repoUrl, canonical))
    .limit(1);

  if (existing[0]) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      status: existing[0].status,
      repo: result.repo,
    });
  }

  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;
  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.slice(0, 200)
      : null;

  await db.insert(submissions).values({
    repoUrl: canonical,
    note: note || null,
    contactEmail: email,
    status: "pending",
  });

  return NextResponse.json({ ok: true, duplicate: false, repo: result.repo });
}
