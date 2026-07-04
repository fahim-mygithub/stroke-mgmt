import type { StrapiImage } from '@/infrastructure/persistence/strapi/StrapiApiResponse';

/**
 * Picks the Strapi image format to use for card thumbnails.
 *
 * Card slots need ~800–1100 physical px on modern phones (3x DPR), so prefer
 * the `large` format (~1000px long edge). Strapi only generates a format when
 * the original exceeds that format's size, so when `large` is absent the
 * original is itself ≤1000px — both sharper than any generated format and
 * bounded in byte size — which also covers small uploads and SVGs
 * (`formats: null`). `thumbnail` (104–245px) is deliberately never picked.
 */
export const pickThumbnailFormatUrl = (
  img: StrapiImage['attributes']
): string => img.formats?.large?.url ?? img.url;
