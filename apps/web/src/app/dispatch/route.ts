/**
 * Atom feed for AskScout articles. Served at /dispatch.
 *
 * Subscribers paste this URL (or the /articles URL — feed readers
 * auto-discover via the <link rel="alternate"> tag in that page's
 * <head>) into Feedly, NetNewsWire, Inoreader, etc., and new
 * articles arrive whenever we deploy.
 *
 * The feed is generated at build time from the same ARTICLES
 * array the visible /articles index reads. Adding a new article
 * automatically updates both surfaces — there is no separate
 * "publish to feed" step.
 *
 * Atom (RFC 4287) chosen over RSS 2.0 for stricter spec
 * compliance and cleaner i18n; every modern reader supports both.
 */

import { ARTICLES } from "@/lib/articles-data";

const SITE_URL = "https://askscout.com";
const FEED_TITLE = "AskScout Articles";
const FEED_DESCRIPTION =
  "Writing on vibe coding, AI-assisted development, and the daily-digest workflow.";
const AUTHOR_NAME = "AskScout";

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toIso = (date: string): string => new Date(`${date}T00:00:00Z`).toISOString();

export const dynamic = "force-static";

export function GET(): Response {
  const updated =
    ARTICLES.length > 0 ? toIso(ARTICLES[0]!.date) : new Date().toISOString();

  const entries = ARTICLES.map((a) => {
    const url = `${SITE_URL}/articles/${a.slug}`;
    const published = toIso(a.date);
    return `  <entry>
    <title>${escapeXml(a.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${published}</updated>
    <published>${published}</published>
    <summary type="text">${escapeXml(a.description)}</summary>
    <author><name>${escapeXml(AUTHOR_NAME)}</name></author>
  </entry>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(FEED_TITLE)}</title>
  <subtitle>${escapeXml(FEED_DESCRIPTION)}</subtitle>
  <link href="${SITE_URL}/articles" />
  <link rel="self" href="${SITE_URL}/dispatch" />
  <id>${SITE_URL}/dispatch</id>
  <updated>${updated}</updated>
  <author><name>${escapeXml(AUTHOR_NAME)}</name></author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
