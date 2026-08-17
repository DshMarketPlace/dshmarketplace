import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";
import { directory } from "@/directory.config";

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/admin/login", directory.baseUrl),
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const GET = POST;
