import { StrapiApiError } from '@/infrastructure/persistence/strapi/StrapiApiError';
import type {
  StrapiApiResponse,
  StrapiArticleData,
  StrapiErrorResponse,
  StrapiSingularApiResponse,
  StrapiPluralApiResponse,
  StrapiArticleMetadata,
} from '@/infrastructure/persistence/strapi/StrapiApiResponse';
import type {
  Article,
  ArticleRepository,
  BaseDesignation,
} from '@/domain/models/Article';
import {
  ArticleId,
  ArticleMetadata,
  Designation,
} from '@/domain/models/Article';
import { strapiResponseToArticle } from '@/infrastructure/persistence/strapi/StrapiArtcleRepository/strapiResponseToArticle';
import type { ImageRepository } from '@/domain/models/Image';
import type { NetworkInfo } from '@/infrastructure/network-info/NetworkInfo';

type Fetch = typeof fetch;

type ResponseData = StrapiArticleData | StrapiArticleMetadata;

const populateSearchParams = new URLSearchParams({
  'populate[0]': 'Thumbnail',
  'populate[1]': 'citations',
  'populate[2]': 'tags',
});

class StrapiArticleRepository implements ArticleRepository {
  constructor(
    private strapiHostUrl: string,
    private fetch: Fetch,
    private placeholderImageRepository: ImageRepository,
    private networkInfo: NetworkInfo
  ) {}

  static $inject = [
    'strapiHostUrl',
    'fetch',
    'placeholderImageRepository',
    'networkInfo',
  ];

  private async get<T extends ResponseData>(
    uri: string
  ): Promise<StrapiApiResponse<T>> {
    const url = this.strapiHostUrl + uri;
    const response = await this.fetch(url);
    const json = await response.json();
    if (!response.ok) {
      throw new StrapiApiError(json as StrapiErrorResponse);
    }
    return json as StrapiApiResponse<T>;
  }

  private async getSingle<T extends ResponseData>(uri: string) {
    const result = await this.get<T>(uri);
    return result as StrapiSingularApiResponse<T>;
  }

  private async getMultiple<T extends ResponseData>(uri: string) {
    const result = await this.get<T>(uri);
    return result as StrapiPluralApiResponse<T>;
  }

  async getAll(): Promise<Article[]> {
    const { data } = await this.get(`/api/articles?${populateSearchParams}`);
    const promises = (data as StrapiArticleData[]).map((d) =>
      this.getDefaultThumbnailAndMakeArticle(d)
    );
    return Promise.all(promises);
  }

  async getById(id: ArticleId): Promise<Article> {
    const idString = id.toString();
    const { data } = await this.get(
      `/api/articles/${idString}?${populateSearchParams}`
    );
    return this.getDefaultThumbnailAndMakeArticle(data as StrapiArticleData);
  }

  async getByDesignation(designation: BaseDesignation): Promise<Article[]> {
    const searchParams = new URLSearchParams({
      'filters=[Designation]': designation.toString(),
    });
    const { data } = await this.get(
      `/api/articles/?${searchParams}&${populateSearchParams}`
    );
    const promises = (data as StrapiArticleData[]).map((d) =>
      this.getDefaultThumbnailAndMakeArticle(d)
    );
    return Promise.all(promises);
  }

  private async getDefaultThumbnailAndMakeArticle(data: StrapiArticleData) {
    const { id } = data;
    const placeholderImage =
      await this.placeholderImageRepository.getDeterministicImageForString(
        `article-${id.toString()}`
      );
    return strapiResponseToArticle(placeholderImage, this.strapiHostUrl, data);
  }

  async getMetadataByDesignation(
    designation: BaseDesignation
  ): Promise<ArticleMetadata[]> {
    const searchParams = new URLSearchParams({
      'fields[0]': 'updatedAt',
    });
    if (designation.is(Designation.ARTICLE))
      searchParams.set('filters[Designation]', 'Article');
    else if (designation.is(Designation.ABOUT))
      searchParams.set('filters[Designation]', 'About');
    else if (designation.is(Designation.DISCLAIMER))
      searchParams.set('filters[Designation]', 'Disclaimer');

    const { data } = await this.getMultiple<StrapiArticleMetadata>(
      `/api/articles?${searchParams}`
    );
    return data.map(
      (d) =>
        new ArticleMetadata(
          new ArticleId(d.id.toString()),
          new Date(d.attributes.updatedAt)
        )
    );
  }

  async getMetadataById(id: ArticleId): Promise<ArticleMetadata> {
    const searchParams = new URLSearchParams({
      'fields[0]': 'updatedAt',
    });
    const { data } = await this.getSingle<StrapiArticleMetadata>(
      `/api/articles/${id}?${searchParams}`
    );
    return new ArticleMetadata(
      new ArticleId(data.id.toString()),
      new Date(data.attributes.updatedAt)
    );
  }

  async getAllMetadata(): Promise<ArticleMetadata[]> {
    const searchParams = new URLSearchParams({
      'fields[0]': 'updatedAt',
    });
    const { data } = await this.getMultiple<StrapiArticleMetadata>(
      `/api/articles?${searchParams}`
    );
    return data.map(
      (d) =>
        new ArticleMetadata(
          new ArticleId(d.id.toString()),
          new Date(d.attributes.updatedAt)
        )
    );
  }

  async isAvailable(): Promise<boolean> {
    return this.networkInfo.isInternetReachable();
  }
}

export { StrapiArticleRepository };
