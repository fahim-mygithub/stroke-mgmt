import type { Algorithm, AlgorithmRepository } from '@/domain/models/Algorithm';
import { AlgorithmId, AlgorithmMetadata } from '@/domain/models/Algorithm';
import { StrapiApiError } from '@/infrastructure/persistence/strapi/StrapiApiError';
import type {
  StrapiAlgorithmData,
  StrapiAlgorithmMetadata,
  StrapiApiResponse,
  StrapiErrorResponse,
  StrapiPluralApiResponse,
  StrapiSingularApiResponse,
} from '@/infrastructure/persistence/strapi/StrapiApiResponse';
import { strapiResponseToAlgorithm } from '@/infrastructure/persistence/strapi/StrapiAlgorithmRepository/strapiResponseToAlgorithm';
import type { ImageRepository } from '@/domain/models/Image';
import type { NetworkInfo } from '@/infrastructure/network-info/NetworkInfo';

type Fetch = typeof fetch;

const populateSearchParams = new URLSearchParams({
  'populate[0]': 'outcomes',
  'populate[1]': 'switches',
  'populate[2]': 'outcomes.criterion',
  'populate[3]': 'outcomes.next',
  'populate[4]': 'switches.levels',
  'populate[5]': 'Thumbnail',
  'populate[6]': 'citations',
});

class StrapiAlgorithmRepository implements AlgorithmRepository {
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

  private async get<D>(uri: string): Promise<StrapiApiResponse<D>> {
    const url = this.strapiHostUrl + uri;
    const response = await this.fetch(url);
    const json = await response.json();
    if (!response.ok) {
      throw new StrapiApiError(json as StrapiErrorResponse);
    }
    return json as StrapiApiResponse<D>;
  }

  private async getSingle<D>(
    uri: string
  ): Promise<StrapiSingularApiResponse<D>> {
    const result = await this.get<D>(uri);
    return result as StrapiSingularApiResponse<D>;
  }

  private async getMultiple<D>(uri: string) {
    const result = await this.get<D>(uri);
    return result as StrapiPluralApiResponse<D>;
  }

  async getAll(): Promise<Algorithm[]> {
    const { data } = await this.get<StrapiAlgorithmData>(
      `/api/algorithms?${populateSearchParams}`
    );
    const promises = (data as StrapiAlgorithmData[]).map((d) =>
      this.getDefaultThumbnailAndMakeArticle(d)
    );
    return Promise.all(promises);
  }

  async getById(id: AlgorithmId): Promise<Algorithm> {
    const idString = id.toString();
    const { data } = await this.get<StrapiAlgorithmData>(
      `/api/algorithms/${idString}?${populateSearchParams}`
    );
    return this.getDefaultThumbnailAndMakeArticle(data as StrapiAlgorithmData);
  }

  async getAllShownOnHomeScreen(): Promise<Algorithm[]> {
    // iOS mangles query strings that mix raw brackets with percent-encoded
    // ones (see strapiUrlEncoding.spec.ts) — always go through
    // URLSearchParams so every bracket is encoded.
    const searchParams = new URLSearchParams({
      'filters[ShowOnHomeScreen]': 'true',
    });
    const { data } = await this.get<StrapiAlgorithmData>(
      `/api/algorithms?${searchParams}&${populateSearchParams}`
    );
    const promises = (data as StrapiAlgorithmData[]).map((d) =>
      this.getDefaultThumbnailAndMakeArticle(d)
    );
    return Promise.all(promises);
  }

  async getAllMetadata(): Promise<AlgorithmMetadata[]> {
    const { data } = await this.getMultiple<StrapiAlgorithmMetadata>(
      `/api/algorithms?${new URLSearchParams({ 'fields[0]': 'updatedAt' })}`
    );
    return data.map(
      (d) =>
        new AlgorithmMetadata(
          new AlgorithmId(d.id.toString()),
          new Date(d.attributes.updatedAt)
        )
    );
  }

  async getMetadataById(id: AlgorithmId): Promise<AlgorithmMetadata> {
    const idString = id.toString();
    const { data } = await this.getSingle<StrapiAlgorithmMetadata>(
      `/api/algorithms/${idString}?${new URLSearchParams({
        'fields[0]': 'updatedAt',
      })}`
    );
    return new AlgorithmMetadata(
      new AlgorithmId(data.id.toString()),
      new Date(data.attributes.updatedAt)
    );
  }

  async getMetadataForAllShownOnHomeScreen(): Promise<AlgorithmMetadata[]> {
    const searchParams = new URLSearchParams({
      'filters[ShowOnHomeScreen]': 'true',
      'fields[0]': 'updatedAt',
    });
    const { data } = await this.getMultiple<StrapiAlgorithmMetadata>(
      `/api/algorithms?${searchParams}`
    );
    return data.map(
      (d) =>
        new AlgorithmMetadata(
          new AlgorithmId(d.id.toString()),
          new Date(d.attributes.updatedAt)
        )
    );
  }

  async isAvailable(): Promise<boolean> {
    return this.networkInfo.isInternetReachable();
  }

  private async getDefaultThumbnailAndMakeArticle(data: StrapiAlgorithmData) {
    const { id } = data;
    const placeholderImage =
      await this.placeholderImageRepository.getDeterministicImageForString(
        `algorithm-${id.toString()}`
      );
    return strapiResponseToAlgorithm(
      placeholderImage,
      this.strapiHostUrl,
      data
    );
  }
}

export { StrapiAlgorithmRepository };
