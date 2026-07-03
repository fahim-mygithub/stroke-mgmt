export type StrapiArticleData = {
  id: number;
  attributes: {
    Title: string;
    Body: string;
    Designation: 'Article' | 'Disclaimer' | 'About';
    ArticleId: string;
    Summary: string | null;
    ShowOnHomeScreen: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    Thumbnail: {
      data: StrapiImage | null;
    };
    tags: {
      data: StrapiTag[];
    };
    citations: StrapiCitation[];
  };
};

export type StrapiArticleMetadata = {
  id: number;
  attributes: {
    updatedAt: string;
  };
};

export type StrapiAlgorithmData = {
  id: number;
  attributes: {
    Title: string;
    Summary: string;
    Body: string;
    ShowOnHomeScreen: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    AlgorithmId: string;
    Thumbnail: {
      data: StrapiImage | null;
    };
    outcomes: {
      id: number;
      Title: string;
      Body: string;
      next: {
        data: { id: number } | null;
      };
      // Added to the CMS schema later; older cached/stored responses lack
      // it and pre-existing rows return null until re-saved.
      TerminalBehavior?: 'Complete' | 'Halt' | null;
      criterion?:
        | {
            id: number;
            Type: 'LessThan' | 'GreaterThan';
            Value: number;
          }
        | { id: number; Type: 'None'; Value: null };
    }[];
    switches: {
      id: number;
      Label: string;
      Description: string | null;
      levels: {
        id: number;
        Label: string;
        Value: number;
      }[];
    }[];
    citations: StrapiCitation[];
  };
};

export type StrapiAlgorithmMetadata = {
  id: number;
  attributes: {
    updatedAt: string;
  };
};

export type StrapiCitation = {
  id: number;
  Citation: string;
};

export type StrapiImageFormat = {
  name: string;
  hash: string;
  ext: string;
  mime: 'image/jpeg' | 'image/png';
  path: null;
  width: number;
  height: number;
  size: number;
  url: string;
};

export type StrapiImage = {
  id: number;
  attributes: {
    name: string;
    alternativeText: null;
    caption: null;
    width: number;
    height: number;
    // Strapi only generates formats for uploads larger than the format
    // size; small images/SVGs come back with `formats: null`.
    formats: {
      thumbnail?: StrapiImageFormat;
      large?: StrapiImageFormat;
      small?: StrapiImageFormat;
      medium?: StrapiImageFormat;
    } | null;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: null;
    provider: string;
    provider_metadata: null;
    createdAt: string;
    updatedAt: string;
  };
};

export type StrapiPlaceholderImageData = {
  id: 1;
  attributes: {
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    Images: {
      data: StrapiImage[];
    };
  };
};

export type StrapiTag = {
  id: number;
  attributes: {
    Name: string;
    Description: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type StrapiIdOnly = {
  id: number;
  attributes: Record<string, never>;
};

export type StrapiIntroSequence = {
  id: number;
  attributes: {
    createdAt: string;
    updatedAt: string;
    articles: {
      data: StrapiIdOnly[];
    };
    suggestedAlgorithm: {
      data: StrapiIdOnly | null;
    };
    suggestAlgorithmAfterArticle: {
      data: StrapiIdOnly | null;
    };
  };
};

export type StrapiPluralApiResponse<Data> = {
  data: Data[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export type StrapiSingularApiResponse<Data> = {
  data: Data;
  meta: Record<string, never>;
};

export type StrapiApiResponse<D> =
  | StrapiSingularApiResponse<D>
  | StrapiPluralApiResponse<D>;

export type StrapiErrorResponse = {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
  };
};
