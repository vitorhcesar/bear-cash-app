const NEUTRAL_INKS = [
  "E0E2DF",
  "E0DFE2",
  "F5F4F5",
  "F5F5F4",
  "F5F5F5",
  "F4F4F4",
  "585D56",
  "59565D",
  "373A36",
  "CBCECA",
  "767D73",
  "CCCCCC",
  "FFFFFF",
  "FFF",
];

/** Near-black Figma inks used as contrast on light grey glyphs (snout, checks). */
const PAPER_INKS = ["0A0B0A", "0A0A0B", "141213", "212022", "212220"];

const ACCENT_INKS = [
  ...PAPER_INKS,
  "95FF52",
  "FFD700",
  "B366FF",
  "9941F1",
  "B385E0",
  "A65BF0",
  "63E29F",
  "C33A22",
  "FF2E31",
  "49DC14",
  "CC9AFE",
  "0C84FC",
  "5B8DEF",
  "2FB70D",
];

const WHITE_PAINT =
  /(stroke|fill)=["'](?:white|#fff(?:fff)?)["']/gi;

function inkPattern(inks: string[]) {
  return new RegExp(`#(?:${inks.join("|")})\\b`, "gi");
}

const NEUTRAL_PATTERN = inkPattern(NEUTRAL_INKS);
const PAPER_PATTERN = inkPattern(PAPER_INKS);
const ALL_PATTERN = inkPattern([...NEUTRAL_INKS, ...ACCENT_INKS]);

function protectClipPaths(xml: string) {
  const clips: string[] = [];
  const body = xml.replace(/<clipPath\b[\s\S]*?<\/clipPath>/gi, (clip) => {
    clips.push(clip);
    return `__BEAR_CLIP_${clips.length - 1}__`;
  });
  return { body, clips };
}

function restoreClipPaths(body: string, clips: string[]) {
  return body.replace(/__BEAR_CLIP_(\d+)__/g, (_, index) => clips[Number(index)] ?? "");
}

function replaceNamedWhite(xml: string, color: string) {
  return xml.replace(WHITE_PAINT, `$1="${color}"`);
}

/**
 * Recolors Figma SVG XML.
 *
 * - `neutral`: grey inks → `color`; near-black contrast inks → `contrastColor`.
 *   Brand hues (gold, green, purple) stay as exported.
 * - `all`: every known Figma ink, used when the caller passes an explicit color.
 */
export function tintSvgXml(
  xml: string,
  color: string,
  mode: "neutral" | "all" = "all",
  contrastColor?: string,
) {
  const { body, clips } = protectClipPaths(xml);
  let next =
    mode === "all"
      ? replaceNamedWhite(body.replace(ALL_PATTERN, color), color)
      : replaceNamedWhite(body.replace(NEUTRAL_PATTERN, color), color);

  if (mode === "neutral" && contrastColor) {
    next = next.replace(PAPER_PATTERN, contrastColor);
  }

  return restoreClipPaths(next, clips);
}
