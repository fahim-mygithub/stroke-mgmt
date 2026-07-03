import { StrapiArticleRepository } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository';
import { StrapiAlgorithmRepository } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository';
import { StrapiIntroSequenceRepository } from '@/infrastructure/persistence/strapi/StrapiIntroSequenceRepository/StrapiIntroSequenceRepository';
import { ArticleId, Designation } from '@/domain/models/Article';
import { AlgorithmId } from '@/domain/models/Algorithm';

/**
 * iOS drops/mangles the query string when a request URL mixes raw brackets
 * (`filters[Designation]=`) with percent-encoded ones (`populate%5B0%5D=`),
 * so Strapi ignores populate/filters and returns unpopulated entities that
 * crash the response mappers ("Cannot read property 'data' of undefined").
 * This was fixed on release/ich (bdcddb6, 8e8dda3) but never ported here.
 * Every URL must be fully percent-encoded: no raw '[' or ']' anywhere.
 */

const capturedUrls: string[] = [];

const emptyListResponse = { data: [] };
const metadataResponse = {
  data: { id: 1, attributes: { updatedAt: '2023-01-01T00:00:00.000Z' } },
};
const introResponse = {
  data: {
    id: 1,
    attributes: {
      updatedAt: '2023-01-01T00:00:00.000Z',
      articles: { data: [{ id: 1 }] },
      suggestedAlgorithm: { data: { id: 1 } },
      suggestAlgorithmAfterArticle: { data: { id: 1 } },
    },
  },
};

function makeFetch(body: unknown) {
  return jest.fn(async (url: string) => {
    capturedUrls.push(url);
    return { ok: true, status: 200, json: async () => body };
  }) as never;
}

const networkInfo = { isInternetReachable: async () => true } as never;
const placeholders = {
  getDeterministicImageForString: async () => ({ getUri: () => 'x' }),
} as never;

describe('strapi request URLs are fully percent-encoded (iOS)', () => {
  beforeEach(() => {
    capturedUrls.length = 0;
  });

  afterEach(() => {
    expect(capturedUrls.length).toBeGreaterThan(0);
    capturedUrls.forEach((url) => {
      expect(url).not.toMatch(/[[\]]/);
    });
  });

  it('article repository list/filter/metadata queries', async () => {
    const repo = new StrapiArticleRepository(
      'host',
      makeFetch(emptyListResponse),
      placeholders,
      networkInfo
    );
    await repo.getAll();
    await repo.getByDesignation(Designation.DISCLAIMER);
    await repo.getAllMetadata();
    await repo.getMetadataByDesignation(Designation.ARTICLE);
  });

  it('article repository by-id queries', async () => {
    const repo = new StrapiArticleRepository(
      'host',
      makeFetch(metadataResponse),
      placeholders,
      networkInfo
    );
    await repo.getMetadataById(new ArticleId('1'));
  });

  it('algorithm repository list/filter/metadata queries', async () => {
    const repo = new StrapiAlgorithmRepository(
      'host',
      makeFetch(emptyListResponse),
      placeholders,
      networkInfo
    );
    await repo.getAll();
    await repo.getAllShownOnHomeScreen();
    await repo.getAllMetadata();
    await repo.getMetadataForAllShownOnHomeScreen();
  });

  it('algorithm repository by-id metadata query', async () => {
    const repo = new StrapiAlgorithmRepository(
      'host',
      makeFetch(metadataResponse),
      placeholders,
      networkInfo
    );
    await repo.getMetadataById(new AlgorithmId('1'));
  });

  it('intro sequence query', async () => {
    const repo = new StrapiIntroSequenceRepository(
      'host',
      makeFetch(introResponse),
      networkInfo
    );
    await repo.get();
  });
});
