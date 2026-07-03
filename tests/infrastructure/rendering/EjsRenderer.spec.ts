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
