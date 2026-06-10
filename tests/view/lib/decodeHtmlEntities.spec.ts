import { decodeHtmlEntities } from '@/view/lib/decodeHtmlEntities';

describe('decodeHtmlEntities', () => {
  it('decodes gt/lt', () => {
    expect(decodeHtmlEntities('LKW &gt; 24 hrs ago')).toBe('LKW > 24 hrs ago');
    expect(decodeHtmlEntities('a &lt; b')).toBe('a < b');
  });

  it('decodes ampersand last to avoid double-decoding', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeHtmlEntities('A &amp;gt; B')).toBe('A &gt; B');
  });

  it('decodes numeric and hex entities', () => {
    expect(decodeHtmlEntities('it&#39;s')).toBe("it's");
    expect(decodeHtmlEntities('it&#x27;s')).toBe("it's");
  });

  it('decodes smart quotes and dashes', () => {
    expect(decodeHtmlEntities('&ldquo;hi&rdquo;')).toBe('“hi”');
    expect(decodeHtmlEntities('4.5&ndash;24')).toBe('4.5–24');
  });

  it('leaves plain text untouched', () => {
    expect(decodeHtmlEntities('Start Triaging')).toBe('Start Triaging');
    expect(decodeHtmlEntities('')).toBe('');
  });
});
