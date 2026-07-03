import sanitizeHtml from 'sanitize-html';

/**
 * Strips dangerous markup from CMS-authored content before it is injected raw
 * (`<%- ... %>`) into the WebView. The CMS API is fetched unauthenticated over
 * HTTPS, so a CMS compromise or MITM is the threat model: anything that could
 * execute script in the WebView (`<script>`, `on*` handlers, `javascript:` /
 * `data:` URLs) must not survive. The allowlist covers the rich-text tags the
 * CMS produces via `marked` plus the table/list markup the templates style.
 */
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    'sub', 'sup', 'small', 'mark', 'abbr',
    'blockquote', 'pre', 'code',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'a', 'img', 'iframe',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'caption', 'colgroup', 'col',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    iframe: [
      'src', 'width', 'height', 'title', 'frameborder',
      'allow', 'allowfullscreen', 'referrerpolicy',
    ],
    th: ['colspan', 'rowspan', 'align'],
    td: ['colspan', 'rowspan', 'align'],
    '*': ['class', 'id'],
  },
  // No `data:` (svg-script vector) and no `javascript:`. `article:` is the
  // app's own cross-article link convention, intercepted by the WebView
  // bridge before it could ever navigate.
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'article'],
  // Video embeds: https-only and pinned to known players.
  allowedSchemesByTag: { iframe: ['https'] },
  allowedIframeHostnames: [
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'player.vimeo.com',
  ],
};

export const sanitizeCmsHtml = (html: string): string =>
  sanitizeHtml(html, options);
