/**
 * Puts back the spaces a model inserts into identifiers when it is writing
 * mixed CJK and Latin: `JSON . parse`, `package . json`, `UTF - 8`,
 * `dsh - plugin - lark`.
 *
 * Narrow on purpose, because the same characters are correct elsewhere:
 *
 * - A dot between two Latin tokens is an identifier in every review we have.
 * - A hyphen before a digit is a version or a cipher suite (`UTF - 8`,
 *   `AES - 256 - GCM`).
 * - A hyphen between two lowercase words is an identifier **in Chinese only**.
 *   English prose uses a spaced hyphen as a dash — "installing it - from
 *   another angle" must survive — and Chinese prose has 破折号 for that.
 * - A *slash* looks identical and is almost always right: `VS Code / Trae`,
 *   `ServerChan / DingTalk / Feishu`. All 22 found were enumerations, so it is
 *   left alone entirely.
 */
export function joinIdentifiers(md: string, locale: "zh" | "en") {
  let out = md
    .replace(/([A-Za-z0-9]) \. ([A-Za-z])/g, "$1.$2")
    .replace(/([A-Za-z]) - (\d)/g, "$1-$2");

  if (locale === "zh") out = out.replace(/([a-z]) - ([a-z])/g, "$1-$2");

  // `AES - 256 - GCM` only half closes above, because the second gap is a
  // digit followed by a letter — and a rule for that shape would eat English
  // prose like "in 2024 - from another angle". Instead the third part attaches
  // to a token that is *already* hyphenated, which nothing in prose is. Twice,
  // because each pass closes one gap.
  for (let i = 0; i < 2; i++) {
    out = out.replace(/([A-Za-z0-9]+-[A-Za-z0-9]+) - ([A-Za-z0-9]+)/g, "$1-$2");
  }

  return out;
}
