import { htmlToText } from './htmlToText';

describe('htmlToText', () => {
  it('extracts the article body and drops surrounding chrome', () => {
    const html = `
      <html><body>
        <nav class="md-nav"><a href="/">Home</a></nav>
        <article>
          <h1>Getting Started</h1>
          <p>Run <code>yarn start</code> to begin.</p>
        </article>
        <footer>© 2026</footer>
      </body></html>`;

    const text = htmlToText(html);

    expect(text).toContain('Getting Started');
    expect(text).toContain('Run yarn start to begin.');
    expect(text).not.toContain('Home');
    expect(text).not.toContain('2026');
  });

  it('strips script and style content', () => {
    const html =
      '<article><style>.a{color:red}</style><p>Visible</p><script>alert(1)</script></article>';

    expect(htmlToText(html)).toBe('Visible');
  });

  it('decodes named and numeric HTML entities', () => {
    const html =
      '<article><p>a &amp; b &lt; c &gt; d &#39;quote&#39; &#x41;</p></article>';

    expect(htmlToText(html)).toBe("a & b < c > d 'quote' A");
  });

  it('preserves block structure as newlines', () => {
    const html =
      '<article><h1>Title</h1><p>One</p><p>Two</p><ul><li>a</li><li>b</li></ul></article>';

    expect(htmlToText(html)).toBe('Title\nOne\nTwo\na\nb');
  });

  it('collapses excess whitespace and blank lines', () => {
    const html = '<article><p>spaced    out</p>\n\n\n<p>text</p></article>';

    expect(htmlToText(html)).toBe('spaced out\n\ntext');
  });

  it('removes MkDocs headerlink permalink anchors from headings', () => {
    const html =
      '<article><h1>Overview<a class="headerlink" href="#overview" title="Permanent link">&para;</a></h1><p>Body</p></article>';

    expect(htmlToText(html)).toBe('Overview\nBody');
  });

  it('falls back to the full document when no article element exists', () => {
    const html = '<div><p>No article wrapper</p></div>';

    expect(htmlToText(html)).toBe('No article wrapper');
  });
});
