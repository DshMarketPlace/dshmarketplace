import { NextResponse } from "next/server";

import { SESSION_COOKIE, checkPassword, createToken } from "@/lib/auth";
import { LOGIN_LIMITER, clientIp, withinRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!(await withinRateLimit(LOGIN_LIMITER, clientIp(request)))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
