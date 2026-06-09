// CMS title/body strings arrive HTML-entity-encoded (e.g. "LKW &gt; 24 hrs").
// Inside a WebView the browser decodes them, but when we surface a title in a
// native <Text> (treatment trail / summary / PDF) we must decode it ourselves.
const NAMED: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
};

export function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  return (
    input
      // numeric entities: &#39; and &#x27;
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      // named entities (decode &amp; last so "&amp;gt;" -> "&gt;" -> ">" is avoided)
      .replace(/&(?:lt|gt|quot|apos|nbsp|ndash|mdash|hellip|ldquo|rdquo|lsquo|rsquo);/g, (m) => NAMED[m] ?? m)
      .replace(/&amp;/g, '&')
  );
}
