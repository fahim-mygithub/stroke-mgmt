import { strapiResponseToAlgorithm } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository/strapiResponseToAlgorithm';
import { strapiResponseToArticle } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository/strapiResponseToArticle';
import { StrapiPlaceholderImageRepository } from '@/infrastructure/persistence/strapi/StrapiPlaceholderImageRepository/StrapiPlaceholderImageRepository';
import { pickThumbnailFormatUrl } from '@/infrastructure/persistence/strapi/pickThumbnailFormatUrl';
import { Image } from '@/domain/models/Image';

/**
 * Card images prefer Strapi's `large` format (~1000px long edge) so they stay
 * sharp in ~800–1100 physical px card slots; the old `thumbnail` pick
 * (104–245px) upscaled 3.6x–10x. Strapi only generates a format when the
 * upload exceeds that format's size, so when `large` is absent the original
 * is itself ≤1000px — sharper than `medium`/`small` and byte-bounded — and
 * the same branch covers tiny images/SVGs (`formats: null`; fallback ported
 * from release/ich f35afd6, "fix: undefined placeholder image uri").
 */

const placeholder = new Image('placeholder.png');

const imageNoFormats = {
  data: {
    id: 9,
    attributes: { formats: null, url: '/uploads/tiny.png' },
  },
} as never;

const imageAllFormats = {
  data: {
    id: 9,
    attributes: {
      formats: {
        thumbnail: { url: '/uploads/thumbnail_big.png' },
        small: { url: '/uploads/small_big.png' },
        medium: { url: '/uploads/medium_big.png' },
        large: { url: '/uploads/large_big.png' },
      },
      url: '/uploads/big.png',
    },
  },
} as never;

const imageSmallFormatsOnly = {
  data: {
    id: 9,
    attributes: {
      formats: {
        thumbnail: { url: '/uploads/thumbnail_mid.png' },
        small: { url: '/uploads/small_mid.png' },
      },
      url: '/uploads/mid.png',
    },
  },
} as never;

const makeAlgorithmData = (thumbnailData: never) =>
  ({
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
      Thumbnail: thumbnailData,
      outcomes: [],
      switches: [],
      citations: [],
    },
  } as never);

describe('pickThumbnailFormatUrl', () => {
  it('prefers large, otherwise uses the original url', () => {
    const formats = {
      thumbnail: { url: '/t' },
      small: { url: '/s' },
      medium: { url: '/m' },
      large: { url: '/l' },
    };
    const pick = (f: object | null) =>
      pickThumbnailFormatUrl({ formats: f, url: '/o' } as never);
    expect(pick(formats)).toBe('/l');
    // no `large` means the original is ≤1000px — sharper than any generated
    // format, so the generated ones are never picked
    expect(pick({ ...formats, large: undefined })).toBe('/o');
    expect(pick({ thumbnail: { url: '/t' } })).toBe('/o');
    expect(pick(null)).toBe('/o');
  });
});

describe('image format fallback', () => {
  it('algorithm thumbnail falls back to original url when formats is null', () => {
    const algo = strapiResponseToAlgorithm(
      placeholder,
      'host',
      makeAlgorithmData(imageNoFormats)
    );
    expect(algo.getThumbnail().getUri()).toBe('host/uploads/tiny.png');
  });

  it('algorithm thumbnail prefers the large format', () => {
    const algo = strapiResponseToAlgorithm(
      placeholder,
      'host',
      makeAlgorithmData(imageAllFormats)
    );
    expect(algo.getThumbnail().getUri()).toBe('host/uploads/large_big.png');
  });

  it('algorithm thumbnail uses the original when large is absent', () => {
    const algo = strapiResponseToAlgorithm(
      placeholder,
      'host',
      makeAlgorithmData(imageSmallFormatsOnly)
    );
    expect(algo.getThumbnail().getUri()).toBe('host/uploads/mid.png');
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

  it('article thumbnail prefers the large format', () => {
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
        Thumbnail: imageAllFormats,
        tags: { data: [] },
        citations: [],
      },
    } as never);
    expect(article.getThumbnail().getUri()).toBe('host/uploads/large_big.png');
  });

  it('placeholder pool prefers the large format and falls back to original', async () => {
    const response = {
      data: {
        id: 1,
        attributes: {
          Images: {
            data: [
              (imageAllFormats as { data: unknown }).data,
              (imageNoFormats as { data: unknown }).data,
            ],
          },
        },
      },
    };
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(response),
    }) as never;
    try {
      const repo = new StrapiPlaceholderImageRepository('host');
      const images = await repo.getAll();
      expect(images.map((i) => i.getUri())).toEqual([
        'host/uploads/large_big.png',
        'host/uploads/tiny.png',
      ]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
