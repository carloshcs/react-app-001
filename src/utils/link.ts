/**
 * Strips a Notion ID of its `db::` prefix and hyphens. Database rows and
 * databases include a double colon namespace; removing it produces the raw
 * UUID. Hyphens are also removed to match the canonical Notion URL scheme.
 */
function cleanId(id: string): string {
  return id.replace(/^db::/, '').replace(/-/g, '');
}

/**
 * Creates a URL‑friendly slug from a node title. Accents are preserved and
 * spaces are converted to hyphens. Non‑alphanumeric characters are stripped
 * to avoid generating invalid URLs. The slug is lowercased to ensure
 * consistency across platforms.
 */
function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-') // collapse runs of non letters/numbers
    .replace(/^-+|-+$/g, '') // trim hyphens at ends
    .replace(/--+/g, '-');
}

/**
 * Given a node title and its Notion identifier, build a permalink to the
 * corresponding Notion page. For database entries, the ID contains a
 * `db::` prefix which is stripped. Hyphens in IDs are removed because
 * Notion canonicalizes UUIDs without hyphens in URLs. The final URL
 * concatenates the slugified title and the cleaned ID separated by a dash.
 */
export function buildNotionUrl(title: string, id: string): string {
  const cleanedId = cleanId(id);
  const slug = slugify(title);
  return `https://www.notion.so/${slug}-${cleanedId}`;
}