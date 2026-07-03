import type { BaseDesignation } from '@/domain/models/Article';
import { Article, ArticleId, Designation } from '@/domain/models/Article';
import { Citation } from '@/domain/models/Citation';
import { Image } from '@/domain/models/Image';
import { Tag } from '@/domain/models/Tag';
import { sanitizeCmsHtml } from '@/infrastructure/html-processing/sanitize/sanitizeCmsHtml';
import type { StrapiArticleData } from '@/infrastructure/persistence/strapi/StrapiApiResponse';

export const strapiResponseToArticle = (
  defaultThumbnail: Image,
  strapiHostUrl: string,
  { id, attributes }: StrapiArticleData
): Article => {
  let designation: BaseDesignation = Designation.ARTICLE;
  switch (attributes.Designation) {
    case 'Disclaimer':
      designation = Designation.DISCLAIMER;
      break;
    case 'About':
      designation = Designation.ABOUT;
      break;
    default:
      break;
  }

  let thumbnail = defaultThumbnail;
  if (attributes.Thumbnail?.data) {
    const img = attributes.Thumbnail.data.attributes;
    // Small uploads/SVGs have no generated formats — fall back to the original.
    thumbnail = new Image(
      strapiHostUrl + (img.formats?.thumbnail?.url ?? img.url)
    );
  }

  return new Article({
    id: new ArticleId(id.toString()),
    title: sanitizeCmsHtml(attributes.Title),
    html: sanitizeCmsHtml(attributes.Body),
    designation,
    summary: attributes.Summary ?? undefined,
    thumbnail,
    shouldShowOnHomeScreen: attributes.ShowOnHomeScreen ?? true,
    lastUpdated: new Date(attributes.updatedAt),
    tags: attributes.tags.data.map(
      (td) =>
        new Tag(
          td.attributes.Name,
          new Date(td.attributes.updatedAt),
          td.attributes.Description ?? undefined
        )
    ),
    citations: attributes.citations.map(
      (c) => new Citation(sanitizeCmsHtml(c.Citation))
    ),
  });
};
