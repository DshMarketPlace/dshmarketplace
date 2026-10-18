import { NextResponse } from "next/server";

import { getMarketRows } from "@/lib/data";
import { buildMarketIndex } from "@/lib/market";

/**
 * A DeepSeek Harness plugin index: add this URL as an index source in the
 * harness's Discover tab (dsh 0.2.1+, experimental "Custom plugin markets").
 * Dynamic for the same reason as /api/v1/index — verdicts land without a
 * deploy — and cached at the edge, because the harness refetches it.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const index = buildMarketIndex(await getMarketRows());
  return NextResponse.json(index, {
    headers: {
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
