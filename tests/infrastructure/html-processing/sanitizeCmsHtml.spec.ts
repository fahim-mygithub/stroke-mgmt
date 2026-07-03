import { sanitizeCmsHtml } from '@/infrastructure/html-processing/sanitize/sanitizeCmsHtml';

describe('sanitizeCmsHtml', () => {
  it('keeps standard rich-text markup produced by the CMS', () => {
    const html =
      '<h2>Heading</h2><p>Some <strong>bold</strong> and <em>italic</em> text.</p>' +
      '<ul><li>one</li><li>two</li></ul>' +
      '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    expect(sanitizeCmsHtml(html)).toBe(html);
  });

  it('keeps images with safe http(s) sources', () => {
    const html = '<img src="https://cms.example.com/x.png" alt="x" />';
    const result = sanitizeCmsHtml(html);
    expect(result).toContain('src="https://cms.example.com/x.png"');
    expect(result).toContain('alt="x"');
  });

  it('removes script tags', () => {
    const result = sanitizeCmsHtml('<p>ok</p><script>alert(1)</script>');
    expect(result).toContain('<p>ok</p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
  });

  it('strips inline event-handler attributes', () => {
    const result = sanitizeCmsHtml('<img src="https://x/y.png" onerror="alert(1)" />');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert(1)');
  });

  it('drops javascript: URLs on links', () => {
    // eslint-disable-next-line no-script-url
    const result = sanitizeCmsHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('click');
  });

  it('drops data: URI image sources (svg/script vector)', () => {
    const result = sanitizeCmsHtml(
      '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" />'
    );
    expect(result).not.toContain('data:');
  });

  it('keeps in-app article: links (custom scheme handled by the WebView bridge)', () => {
    const result = sanitizeCmsHtml('<a href="article:15">DEFUSE 3</a>');
    expect(result).toContain('href="article:15"');
    expect(result).toContain('DEFUSE 3');
  });

  it('keeps YouTube embed iframes with their sizing attributes', () => {
    const html =
      '<iframe width="1280" height="720" src="https://www.youtube.com/embed/6F2Opo0IHms" ' +
      'title="TRAP" frameborder="0" allowfullscreen></iframe>';
    const result = sanitizeCmsHtml(html);
    expect(result).toContain('<iframe');
    expect(result).toContain('src="https://www.youtube.com/embed/6F2Opo0IHms"');
    expect(result).toContain('width="1280"');
  });

  it('drops iframes from non-allowlisted hosts', () => {
    const result = sanitizeCmsHtml(
      '<iframe src="https://evil.example.com/x"></iframe>'
    );
    expect(result).not.toContain('evil.example.com');
  });

  it('drops non-https iframe sources', () => {
    const result = sanitizeCmsHtml(
      '<iframe src="http://www.youtube.com/embed/abc"></iframe>'
    );
    expect(result).not.toContain('http://www.youtube.com');
  });

  it('escapes stray angle brackets in plain text titles', () => {
    expect(sanitizeCmsHtml('A < B & C')).toBe('A &lt; B &amp; C');
  });

  it('leaves a plain string untouched', () => {
    expect(sanitizeCmsHtml('Acute Ischemic Stroke')).toBe(
      'Acute Ischemic Stroke'
    );
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeCmsHtml('')).toBe('');
  });
});
