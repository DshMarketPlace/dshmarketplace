import { getInstallStatusBySlug } from "@/lib/data";

/**
 * The install verdict as an embeddable SVG — the one claim a listing here can
 * make that a card wall cannot, served where maintainers actually are: their
 * own README.
 *
 * The text is drawn from three fixed strings and never from the URL, so there
 * is nothing to inject. `textLength` pins the metrics, because the README is
 * rendered by whatever font the reader's platform ships and an unpinned label
 * overflows its box on some of them.
 *
 * `failed` and `timeout` render as "not verified", not as a red "failing":
 * that bucket has repeatedly been our own fault (bad npm claims, a mid-run
 * probe change, upstream 429s), and a README is someone else's front door —
 * the strong negative claim stays on our page, where the full verdict and its
 * date are next to it.
 */

const INK = "#241c15"; // --ink, converted from oklch for SVG
const COPPER = "#b64e06"; // --copper
const FAINT = "#8e847d"; // --ink-faint
const PAPER = "#f8f5f0"; // --paper

const LABEL = "dsh install";
const LABEL_W = 72;

type Value = { text: string; width: number; color: string };

const VERIFIED: Value = { text: "verified", width: 58, color: COPPER };
const NOT_VERIFIED: Value = { text: "not verified", width: 76, color: FAINT };
const NOT_LISTED: Value = { text: "not listed", width: 66, color: FAINT };

function badgeSvg(value: Value) {
  const width = LABEL_W + value.width;
  const title = `${LABEL}: ${value.text}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${title}">
  <title>${title}</title>
  <g shape-rendering="crispEdges">
    <rect width="${LABEL_W}" height="20" fill="${INK}"/>
    <rect x="${LABEL_W}" width="${value.width}" height="20" fill="${value.color}"/>
  </g>
  <g fill="${PAPER}" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${LABEL_W / 2}" y="14" textLength="${LABEL_W - 12}">${LABEL}</text>
    <text x="${LABEL_W + value.width / 2}" y="14" textLength="${value.width - 12}">${value.text}</text>
  </g>
</svg>`;
}

function respond(value: Value, status: number, maxAge: number) {
  return new Response(badgeSvg(value), {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // GitHub proxies README images through camo, which honours these; one
      // day at the edge is right for a verdict that moves nightly at most.
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=86400`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = raw.endsWith(".svg") ? raw.slice(0, -4) : raw;

  const row = await getInstallStatusBySlug(slug);

  // A short-lived 404 body is still a drawable badge, so a listing embedded
  // moments before its first sync heals without the author touching anything.
  if (!row) return respond(NOT_LISTED, 404, 300);

  const verified =
    row.installStatus === "passed" || row.installStatus === "needs-approval";

  return respond(verified ? VERIFIED : NOT_VERIFIED, 200, 3600);
}
