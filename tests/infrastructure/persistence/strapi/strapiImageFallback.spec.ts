import { strapiResponseToAlgorithm } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository/strapiResponseToAlgorithm';
import { strapiResponseToArticle } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository/strapiResponseToArticle';
import { Image } from '@/domain/models/Image';

/**
 * Strapi only generates image formats (thumbnail/small/…) for uploads larger
 * than the format size; small images and SVGs come back with `formats: null`.
 * Mappers must fall back to the original `url` instead of crashing — ported
 * from release/ich f35afd6 ("fix: undefined placeholder image uri").
 */

const placeholder = new Image('placeholder.png');

const imageNoFormats = {
  data: {
    id: 9,
    attributes: { formats: null, url: '/uploads/tiny.png' },
  },
} as never;

const imageWithFormats = {
  data: {
    id: 9,
    attributes: {
      formats: { thumbnail: { url: '/uploads/thumbnail_big.png' } },
      url: '/uploads/big.png',
    },
  },
} as never;

describe('image format fallback', () => {
  it('algorithm thumbnail falls back to original url when formats is null', () => {
    const algo = strapiResponseToAlgorithm(placeholder, 'host', {
      id: 1,
      attributes: {
        Title: 'T',
        Summary: 's',
        Body: 'b',
        ShowOnHomeScreen: true,
        createdAt: '',
        updatedAt: '2023-01-01T00:00:00.000Z',
        publishedAt: '',
        AlgorithmId: 'x',
        Thumbnail: imageNoFormats,
        outcomes: [],
        switches: [],
        citations: [],
      },
    } as never);
    expect(algo.getThumbnail().getUri()).toBe('host/uploads/tiny.png');
  });

  it('algorithm thumbnail prefers the generated thumbnail format', () => {
    const algo = strapiResponseToAlgorithm(placeholder, 'host', {
      id: 1,
      attributes: {
        Title: 'T',
        Summary: 's',
        Body: 'b',
        ShowOnHomeScreen: true,
        createdAt: '',
        updatedAt: '2023-01-01T00:00:00.000Z',
        publishedAt: '',
        AlgorithmId: 'x',
        Thumbnail: imageWithFormats,
        outcomes: [],
        switches: [],
        citations: [],
      },
    } as never);
    expect(algo.getThumbnail().getUri()).toBe('host/uploads/thumbnail_big.png');
  });

  it('article thumbnail falls back to original url when formats is null', () => {
    const article = strapiResponseToArticle(placeholder, 'host', {
      id: 1,
      attributes: {
        Title: 'T',
        Body: 'b',
        Designation: 'Article',
        Summary: null,
        ShowOnHomeScreen: true,
        createdAt: '',
        updatedAt: '2023-01-01T00:00:00.000Z',
        publishedAt: '',
        Thumbnail: imageNoFormats,
        tags: { data: [] },
        citations: [],
      },
    } as never);
    expect(article.getThumbnail().getUri()).toBe('host/uploads/tiny.png');
  });
});
