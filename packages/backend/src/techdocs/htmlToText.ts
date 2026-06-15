/**
 * Converts a rendered TechDocs HTML page into readable plain text.
 *
 * TechDocs serves MkDocs-generated HTML, which wraps the actual documentation in
 * an `<article>` element surrounded by navigation chrome (sidebars, search bar,
 * footer). For AI consumption we want the article body only, stripped of markup.
 *
 * This is intentionally a small hand-rolled converter rather than a dependency:
 * the output only needs to be readable, not a faithful HTML-to-Markdown mapping.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const codePoint =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

/**
 * Extracts the inner HTML of the MkDocs `<article>` element. Falls back to the
 * full input when no article is present (e.g. non-standard themes), so callers
 * always get whatever content exists rather than an empty string.
 */
function extractArticle(html: string): string {
  const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  return match ? match[1] : html;
}

export function htmlToText(html: string): string {
  const withoutNoise = extractArticle(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    // MkDocs Material appends a "¶" permalink anchor to every heading; drop it
    // so headings don't end with a stray pilcrow.
    .replace(/<a[^>]*class="[^"]*headerlink[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');

  // Map structural tags to newlines before stripping so the text keeps its
  // block layout; everything else collapses to spaces.
  const withBreaks = withoutNoise
    .replace(/<\/(p|div|li|h[1-6]|tr|article|section|pre|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(withBreaks)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
