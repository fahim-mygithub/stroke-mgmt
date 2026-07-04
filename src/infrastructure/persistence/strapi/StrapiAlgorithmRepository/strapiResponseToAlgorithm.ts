import type { Criterion } from '@/domain/models/Algorithm';
import {
  AlgorithmId,
  AlgorithmInfo,
  Outcome,
  ScoredAlgorithm,
  Switch,
  SwitchId,
  TextAlgorithm,
  GreaterThanCriterion,
  LessThanCriterion,
  NoCriterion,
  Level,
  LevelId,
} from '@/domain/models/Algorithm';
import { Citation } from '@/domain/models/Citation';
import { Image } from '@/domain/models/Image';
import { sanitizeCmsHtml } from '@/infrastructure/html-processing/sanitize/sanitizeCmsHtml';
import type { StrapiAlgorithmData } from '@/infrastructure/persistence/strapi/StrapiApiResponse';
import { pickThumbnailFormatUrl } from '@/infrastructure/persistence/strapi/pickThumbnailFormatUrl';

export const strapiResponseToAlgorithm = (
  defaultThumbnail: Image,
  strapiHostUrl: string,
  { id: algoId, attributes }: StrapiAlgorithmData
): TextAlgorithm | ScoredAlgorithm => {
  const {
    Title,
    Summary,
    Body,
    ShowOnHomeScreen,
    updatedAt,
    outcomes: outcomeData,
    switches: switchData,
    citations: citationData,
  } = attributes;

  const outcomes = outcomeData.map(
    ({
      Title: tData,
      Body: bData,
      criterion: critData,
      next: nextData,
      TerminalBehavior: terminalData,
    }) => {
      let criterion: Criterion = new NoCriterion();

      if (critData?.Type === 'GreaterThan') {
        criterion = new GreaterThanCriterion(critData.Value);
      } else if (critData?.Type === 'LessThan') {
        criterion = new LessThanCriterion(critData?.Value);
      }

      const next = nextData.data
        ? new AlgorithmId(nextData.data.id.toString(10))
        : undefined;

      return new Outcome({
        title: sanitizeCmsHtml(tData),
        body: sanitizeCmsHtml(bData),
        criterion,
        next,
        terminalBehavior: terminalData ?? undefined,
      });
    }
  );

  let thumbnail = defaultThumbnail;
  if (attributes.Thumbnail?.data) {
    const img = attributes.Thumbnail.data.attributes;
    thumbnail = new Image(strapiHostUrl + pickThumbnailFormatUrl(img));
  }

  const citations = citationData.map(
    (c) => new Citation(sanitizeCmsHtml(c.Citation))
  );

  const info = new AlgorithmInfo({
    id: new AlgorithmId(algoId.toString()),
    title: sanitizeCmsHtml(Title),
    summary: Summary,
    body: sanitizeCmsHtml(Body),
    outcomes,
    thumbnail,
    shouldShowOnHomeScreen: ShowOnHomeScreen ?? true,
    lastUpdated: new Date(updatedAt),
    citations,
  });

  if (switchData.length === 0) {
    return new TextAlgorithm({ info });
  }
  const switches = switchData.map(
    ({ id: switchId, Label, Description, levels }) =>
      new Switch({
        id: new SwitchId(switchId.toString()),
        label: sanitizeCmsHtml(Label),
        description:
          Description === null ? undefined : sanitizeCmsHtml(Description),
        levels: levels.map(
          (l) =>
            new Level(
              new LevelId(l.id.toString()),
              sanitizeCmsHtml(l.Label),
              l.Value
            )
        ),
      })
  );

  return new ScoredAlgorithm({ info, switches });
};
