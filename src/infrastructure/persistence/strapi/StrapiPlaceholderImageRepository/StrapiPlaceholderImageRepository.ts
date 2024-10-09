import shajs from 'sha.js';
import type {
  StrapiApiResponse,
  StrapiErrorResponse,
  StrapiPlaceholderImageData,
} from '@/infrastructure/persistence/strapi/StrapiApiResponse';
import { StrapiApiError } from '@/infrastructure/persistence/strapi/StrapiApiError';
import type { ImageRepository } from '@/domain/models/Image';
import { Image } from '@/domain/models/Image';

function stringToNumber(str: string): number {
  const input = str ?? '0'; // in case of empty string
  const hash = shajs('sha256').update(input).digest('hex');
  return parseInt(hash.slice(0, 6), 16);
}

class StrapiPlaceholderImageRepository implements ImageRepository {
  private images: Promise<Image[]>;

  constructor(private strapiHostUrl: string) {
    this.images = this.getAll();
  }

  static $inject = ['strapiHostUrl'];

  private async fetchData(): Promise<
    StrapiApiResponse<StrapiPlaceholderImageData>
  > {
    const PATH = '/api/placeholder-image?populate=Images';
    const response = await fetch(this.strapiHostUrl + PATH);
    const responseJson = (await response.json()) as
      | StrapiApiResponse<StrapiPlaceholderImageData>
      | StrapiErrorResponse;

    if ('error' in responseJson) throw new StrapiApiError(responseJson);
    return responseJson;
  }

  async getAll(): Promise<Image[]> {
    const response = await this.fetchData();
    const data = response.data as StrapiPlaceholderImageData;
    return data.attributes.Images.data.map(
      (i) => new Image(this.strapiHostUrl + i.attributes.url)
    );
  }

  async getDeterministicImageForString(str: string): Promise<Image> {
    const images = await this.images;
    const index = stringToNumber(str) % images.length;
    return images[index];
  }
}

export { StrapiPlaceholderImageRepository };
