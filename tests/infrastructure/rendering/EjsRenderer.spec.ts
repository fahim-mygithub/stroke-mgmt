import {
  AlgorithmId,
  AlgorithmInfo,
  Outcome,
  TextAlgorithm,
} from '@/domain/models/Algorithm';
import { Article, ArticleId, Designation } from '@/domain/models/Article';
import { NodeFileSystem } from '@/infrastructure/file-system/node/NodeFileSystem';
import { FakeAlgorithmRepository } from '@/infrastructure/persistence/fake/FakeAlgorithmRepository';
import { EjsRenderer } from '@/infrastructure/rendering/ejs/EjsRenderer';
import { Image } from '@/domain/models/Image';

describe('EjsAlgorithmRenderer', () => {
  let repo: FakeAlgorithmRepository;
  let fs: NodeFileSystem;
  beforeAll(() => {
    jest.resetModules();
    const assets = [
      '@/infrastructure/rendering/ejs/EjsRenderer/partials/style.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/partials/script.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/partials/head.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/partials/noOutcomesYet.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/partials/outcomeList.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/textAlgorithm.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/scoredAlgorithm.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/article.ejs',
      '@/infrastructure/rendering/ejs/EjsRenderer/disclaimer.ejs',
    ];
    assets.forEach((a) => jest.doMock(a, () => a));
    fs = new NodeFileSystem();
    repo = new FakeAlgorithmRepository();
  });

  describe('Instantiation', () => {
    it('should be created given file system with template', () => {
      const create = () => new EjsRenderer(fs);
      expect(create).not.toThrow();
    });
  });

  describe('Behavior', () => {
    it('should render text algorithm', async () => {
      const textAlgo = await repo.getById(new AlgorithmId('0'));
      const renderer = new EjsRenderer(fs);
      const result = await renderer.renderAlgorithm(textAlgo);
      expect(result).toMatchSnapshot();
    });

    it('should render scored algorithm', async () => {
      const scoredAlgo = await repo.getById(new AlgorithmId('1'));
      const renderer = new EjsRenderer(fs);
      const result = await renderer.renderAlgorithm(scoredAlgo);
      expect(result).toMatchSnapshot();
    });

    it('renders no button for a next-less outcome tagged Halt', async () => {
      const info = new AlgorithmInfo({
        id: new AlgorithmId('2'),
        title: 'Halting algorithm',
        body: 'body',
        summary: 'summary',
        thumbnail: new Image('/img.png'),
        outcomes: [
          new Outcome({
            title: 'Not Stable',
            body: 'Stabilize before continuing',
            terminalBehavior: 'Halt',
          }),
          new Outcome({ title: 'Done', body: 'All done' }),
        ],
        shouldShowOnHomeScreen: true,
        lastUpdated: new Date(0),
        citations: [],
      });

      const renderer = new EjsRenderer(fs);
      const html = await renderer.renderAlgorithm(new TextAlgorithm({ info }));
      // Halt outcome (index 0) gets no finish button; the completable
      // terminal outcome (index 1) still gets one.
      expect(html).not.toContain('__finish__:0');
      expect(html).toContain('__finish__:1');
    });

    it('renders a completion button instead of the outcome list when no outcomes are attached', async () => {
      const info = new AlgorithmInfo({
        id: new AlgorithmId('3'),
        title: 'Terminal algorithm',
        body: 'The pathway ends here',
        summary: 'summary',
        thumbnail: new Image('/img.png'),
        outcomes: [],
        shouldShowOnHomeScreen: true,
        lastUpdated: new Date(0),
        citations: [],
      });

      const renderer = new EjsRenderer(fs);
      const html = await renderer.renderAlgorithm(new TextAlgorithm({ info }));
      expect(html).toContain('__finish__:-1');
      // The class name still appears in the inlined stylesheet; only the
      // rendered headline element must be absent.
      expect(html).not.toContain('<h1 class="template outcomes__headline">');
      expect(html).not.toContain('Results will appear here');
    });

    // The generated CSS is snapshotted, but a snapshot only reports that it
    // changed — it cannot say the image rule is still correct. These assert it.
    describe('image sizing rules', () => {
      const collapse = (css: string) => css.replace(/\s+/g, ' ');

      it.each([
        ['text algorithm', '0'],
        ['scored algorithm', '1'],
      ])('caps images instead of stretching them (%s)', async (_name, id) => {
        const algorithm = await repo.getById(new AlgorithmId(id));
        const renderer = new EjsRenderer(fs);
        const css = collapse(await renderer.renderAlgorithm(algorithm));

        expect(css).toContain('img { max-width: 100%; height: auto;');
        // `width: 100%` upscales a small image past its intrinsic size and
        // is defeated in every intrinsic-sizing context (table cells, flex
        // labels, the absolutely-positioned tooltip).
        expect(css).not.toMatch(/img\s*\{[^}]*[^-]width:\s*100%/);
      });

      it('keeps iframes filling the column', async () => {
        const algorithm = await repo.getById(new AlgorithmId('0'));
        const renderer = new EjsRenderer(fs);
        const css = collapse(await renderer.renderAlgorithm(algorithm));

        expect(css).toContain('iframe { width: 100%; max-width: 100%; }');
      });

      it('bounds the switch tooltip so a wide child cannot escape the page', async () => {
        const algorithm = await repo.getById(new AlgorithmId('1'));
        const renderer = new EjsRenderer(fs);
        const css = collapse(await renderer.renderAlgorithm(algorithm));

        // The tooltip is position:absolute, so it is shrink-to-fit and would
        // otherwise take a replaced child's full intrinsic width.
        expect(css).toMatch(
          /\.template\.switches__tooltip \{[^}]*max-width: 100%/
        );
        expect(css).toMatch(
          /\.template\.switches__tooltip \{[^}]*box-sizing: border-box/
        );
      });

      it('never floors the switch label below its min-content width', async () => {
        // The label and the level chips are the two flex items of a
        // space-between row, so they sit edge to edge with no gap to absorb
        // overflow — and the chips paint after the label, over it. Allowing the
        // label to shrink past its text slices long single-word labels
        // ("Thrombocytopenia") behind the first chip. Measured: 15.8px of the
        // word hidden at 360dp, 45.7px at 320dp with five levels.
        const algorithm = await repo.getById(new AlgorithmId('1'));
        const renderer = new EjsRenderer(fs);
        const css = collapse(await renderer.renderAlgorithm(algorithm));

        expect(css).not.toMatch(
          /\.template\.switches__group-label[^{]*\{[^}]*min-width: 0/
        );
      });

      it('never uses a const loop counter in any template', async () => {
        // `for (const i = 0; i < n; i++)` throws on the first increment, and it
        // sits in the iframe-wrapping block — so on any document with a video
        // embed every IIFE after it silently never runs. In article.ejs that
        // killed the table wrapper: a procedure-demo article with a video AND a
        // table overflowed the page by 268px at 376 CSS px, measured.
        // Each template carries its own copy of this script.
        const algorithm = await repo.getById(new AlgorithmId('0'));
        const article = new Article({
          summary: 'My Summary',
          thumbnail: new Image('/img.png'),
          id: new ArticleId('3'),
          title: 'hello world',
          html: '<p>body</p>',
          designation: Designation.ARTICLE,
          shouldShowOnHomeScreen: true,
          lastUpdated: new Date(0),
          citations: [],
        });
        const renderer = new EjsRenderer(fs);

        const documents = await Promise.all([
          renderer.renderAlgorithm(algorithm),
          renderer.renderArticle(article),
          renderer.renderDisclaimer(article),
        ]);

        documents.forEach((html) => {
          expect(html).not.toContain('for (const i = 0');
          // The load listener has to go on the clone the wrapper inserts; the
          // original is detached by then.
          expect(html).toContain(
            "wrappedFrame.querySelector('iframe').addEventListener('load'"
          );
        });
      });

      it('applies the same cap to articles', async () => {
        const article = new Article({
          summary: 'My Summary',
          thumbnail: new Image('/img.png'),
          id: new ArticleId('2'),
          title: 'hello world',
          html: '<p><img src="/wide.png" alt=""></p>',
          designation: Designation.ARTICLE,
          shouldShowOnHomeScreen: true,
          lastUpdated: new Date(0),
          citations: [],
        });

        const renderer = new EjsRenderer(fs);
        const css = collapse(await renderer.renderArticle(article));

        expect(css).toContain('img { max-width: 100%; height: auto;');
      });
    });

    it('should render article title and html', async () => {
      const article = new Article({
        summary: 'My Summary',
        thumbnail: new Image('/img.png'),
        id: new ArticleId('0'),
        title: 'hello world',
        html: '<h1>foo bar</h1>',
        designation: Designation.ARTICLE,
        shouldShowOnHomeScreen: true,
        lastUpdated: new Date(0),
        citations: [],
      });

      const renderer = new EjsRenderer(fs);
      const html = await renderer.renderArticle(article);
      expect(html).toMatchSnapshot();
    });

    it('should render disclaimer html', async () => {
      const article = new Article({
        summary: 'My Summary',
        thumbnail: new Image('/img.png'),
        id: new ArticleId('1'),
        title: 'hello world',
        html: '<h1>foo bar</h1>',
        designation: Designation.DISCLAIMER,
        shouldShowOnHomeScreen: true,
        lastUpdated: new Date(0),
        citations: [],
      });

      const renderer = new EjsRenderer(fs);
      const html = await renderer.renderDisclaimer(article);
      expect(html).toMatchSnapshot();
    });
  });
});
