/**
 * Renders the repository banners.
 *
 * A hybrid on purpose: the artwork is generated, the type is drawn.
 *
 * Image models produce genuinely good isometric line-art in the site's palette
 * — far better than anything hand-drawn here — but they cannot set type, and a
 * banner with garbled lettering looks worse than no banner at all. So the model
 * is asked for artwork with no text in it, and the wordmark, tagline and
 * install command are laid over it as SVG.
 *
 *   pnpm tsx scripts/build-repo-banner.ts
 */
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

import { generateImageSync } from "./lib/velokey";

const run = promisify(execFile);

const OUT = "/tmp/banners";

const PAPER = "#f7f4ed";
const INK = "#241f1a";
const COPPER = "#c0561d";
const RULE = "#ddd6c8";
const MUTED = "#6b6055";
const SANS = "Helvetica Neue, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, Menlo, monospace";

/** One art direction for both banners, so the pair reads as a set. */
const ART = [
  "Wide banner illustration on warm cream paper, colour #F7F1E6.",
  "Isometric technical line-art drawn in copper-orange ink #C0561D with muted",
  "sage and clay accents, subtle paper grain, no pure black and no pure white.",
  "Blueprint schematic feel: geometric primitives, dotted construction lines,",
  "measured spacing, composition weighted to the right half of the frame with",
  "generous empty paper on the left.",
  "Absolutely no text, no letters, no numbers, no logos, no brand marks,",
  "no user interface screenshots, no human figures.",
].join(" ");

const MARK = (x: number, y: number, s: number) => `
  <g transform="translate(${x} ${y}) scale(${s / 64})">
    <rect width="64" height="64" fill="${INK}"/>
    <path d="M0 58h64v6H0z" fill="${COPPER}"/>
    <g fill="${PAPER}">
      <path d="M27.5 16.5v6.4L18.4 32l9.1 9.1v6.4L12 32z"/>
      <path d="M36.5 16.5 52 32 36.5 47.5v-8.9a6.6 6.6 0 0 1 0-13.2z"/>
    </g>
  </g>`;

type Banner = {
  file: string;
  title: string;
  /** Kept under ~46 characters — 34px type overruns the measure past that. */
  tagline: string[];
  command: string;
  subject: string;
};

const BANNERS: Banner[] = [
  {
    file: "banner-site",
    title: "DSH Marketplace",
    tagline: ["Every DeepSeek Harness plugin,", "with a page worth reading"],
    command: "curl -s dshmarketplace.dev/api/v1/plugins",
    subject:
      "a wide wall of indexed filing drawers seen at a slight angle, three pulled open to reveal layered cards standing on edge, dotted measure lines running between the fronts",
  },
  {
    file: "banner-plugin",
    title: "DSH Marketplace",
    tagline: ["Install DeepSeek Harness plugins", "without leaving DSH"],
    command: "dsh plugin --profile web add dshmarketplace-plugin",
    subject:
      "a tall modular cabinet of open sockets being filled by small cubes that arrive along dotted rails from off-frame",
  },
  {
    file: "banner-py",
    title: "DSH Marketplace for Python",
    tagline: ["DeepSeek Harness plugins,", "importable"],
    command: "pip install dshmarketplace",
    subject:
      "two interlocking coiled ribbons descending through a stack of open trays, each tray holding a small labelled block, dotted guide lines tracing the path between them",
  },
  {
    file: "banner-cli",
    title: "DSH Marketplace CLI",
    tagline: ["DeepSeek Harness plugins,", "built for coding agents"],
    command: "npx dshmarketplace-cli find memory",
    subject:
      "a terminal-shaped prism emitting a focused beam through a lens that fans out into a row of crates, each on its own plinth",
  },
];

function svg(b: Banner, artB64: string) {
  const lines = b.tagline
    .map(
      (line, i) =>
        `<text x="72" y="${222 + i * 46}" font-family="${SANS}" font-size="34" font-weight="700" fill="${i === b.tagline.length - 1 ? COPPER : INK}" letter-spacing="-0.6">${line}</text>`,
    )
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="440" viewBox="0 0 1280 440">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${PAPER}" stop-opacity="1"/>
        <stop offset="52%" stop-color="${PAPER}" stop-opacity="0.97"/>
        <stop offset="78%" stop-color="${PAPER}" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <rect width="1280" height="440" fill="${PAPER}"/>
    <image href="data:image/png;base64,${artB64}" x="360" y="-118" width="1040" height="693" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1280" height="440" fill="url(#scrim)"/>

    ${MARK(72, 56, 48)}
    <text x="136" y="90" font-family="${SANS}" font-size="25" font-weight="700" fill="${INK}" letter-spacing="-0.4">${b.title}</text>
    <line x1="72" y1="132" x2="640" y2="132" stroke="${RULE}" stroke-width="1"/>

    ${lines}

    <g transform="translate(72 300)">
      <rect width="620" height="54" fill="#efe9dc" stroke="${RULE}"/>
      <text x="20" y="34" font-family="${MONO}" font-size="16" fill="${COPPER}">$</text>
      <text x="40" y="34" font-family="${MONO}" font-size="16" fill="${INK}">${b.command}</text>
    </g>

    <text x="72" y="400" font-family="${MONO}" font-size="14" fill="${MUTED}">dshmarketplace.dev</text>
    <text x="278" y="400" font-family="${SANS}" font-size="14" fill="${MUTED}">MIT · Independent project, not affiliated with DeepSeek</text>
  </svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Each render costs a generation, so re-running for one banner should not
  // redraw the other two.
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const wanted = only.length
    ? BANNERS.filter((b) => only.some((o) => b.file.includes(o)))
    : BANNERS;

  for (const b of wanted) {
    process.stdout.write(`→ ${b.file} … `);

    const art = await generateImageSync(`${ART} Subject: ${b.subject}.`, {
      size: "1536x1024",
    });
    await writeFile(`${OUT}/${b.file}-art.png`, art);

    const doc = `${OUT}/${b.file}.svg`;
    await writeFile(doc, svg(b, art.toString("base64")));

    await run("python3", [
      "-c",
      `import cairosvg; cairosvg.svg2png(url=${JSON.stringify(doc)}, write_to=${JSON.stringify(`${OUT}/${b.file}.png`)}, output_width=1280, output_height=440)`,
    ]);
    await run("sips", [
      "-s", "format", "jpeg", "-s", "formatOptions", "72",
      `${OUT}/${b.file}.png`, "--out", `${OUT}/${b.file}.jpg`,
    ]);

    const { stdout } = await run("stat", ["-f", "%z", `${OUT}/${b.file}.jpg`]);
    console.log(`${stdout.trim()} bytes`);
  }
}

main();
