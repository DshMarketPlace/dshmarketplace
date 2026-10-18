import { t } from "@/lib/dict";
import { absoluteUrl, type Locale } from "@/lib/i18n";

/**
 * Share destinations that take a URL. WeChat has no web composer, so it is a
 * copy action in the dialog rather than a channel here.
 *
 * Production origins only — a share from localhost must still send someone
 * to dshmarketplace.dev. `window.location` would leak the author's machine.
 */
export type ShareTarget =
  | { kind: "site" }
  | {
      kind: "plugin";
      name: string;
      fullName: string;
      summary: string | null;
      slug: string;
    };

export type SharePayload = {
  url: string;
  title: string;
  text: string;
  body: string;
  topicTitle: string;
};

export type ShareChannel =
  | "linuxdo"
  | "x"
  | "weibo"
  | "telegram"
  | "reddit"
  | "linkedin"
  | "whatsapp";

/** LINUX DO first: that is where this directory is actually discussed. */
export function channelsFor(locale: Locale): ShareChannel[] {
  return locale === "zh"
    ? ["linuxdo", "weibo", "x", "telegram", "reddit", "linkedin", "whatsapp"]
    : ["linuxdo", "x", "reddit", "telegram", "linkedin", "whatsapp", "weibo"];
}

function flatten(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function composeShare(
  locale: Locale,
  target: ShareTarget,
): SharePayload {
  const d = t(locale).share;
  const siteUrl = absoluteUrl(locale);

  if (target.kind === "site") {
    return {
      url: siteUrl,
      title: d.siteTitle,
      text: d.siteText,
      body: d.siteBody(siteUrl),
      topicTitle: d.linuxdoSiteTitle,
    };
  }

  const pluginUrl = absoluteUrl(locale, `/plugins/${target.slug}`);
  const summary = target.summary ? flatten(target.summary) : null;

  return {
    url: pluginUrl,
    title: d.pluginShareTitle(target.name),
    text: d.pluginText(target.name, summary),
    body: d.pluginBody({
      name: target.name,
      fullName: target.fullName,
      summary,
      pluginUrl,
      siteUrl,
    }),
    topicTitle: d.linuxdoPluginTitle(target.name),
  };
}

/** X counts a URL as 23 characters plus a space, regardless of length. */
function tweetStatus(text: string, url: string) {
  const budget = 280 - 24;
  const clipped =
    text.length <= budget
      ? text
      : `${text.slice(0, Math.max(0, budget - 1)).trimEnd()}…`;
  return `${clipped} ${url}`;
}

export function shareHref(
  channel: ShareChannel,
  payload: SharePayload,
): string {
  const { url, text, body, topicTitle, title } = payload;
  switch (channel) {
    case "linuxdo":
      return `https://linux.do/new-topic?title=${encodeURIComponent(topicTitle)}&body=${encodeURIComponent(body)}`;
    case "x":
      return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetStatus(text, url))}`;
    case "weibo":
      return `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${title} ${text}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(body)}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(topicTitle)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(body)}`;
  }
}
