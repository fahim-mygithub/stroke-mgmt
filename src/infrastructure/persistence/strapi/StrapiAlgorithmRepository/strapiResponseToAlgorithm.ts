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
import type { StrapiAlgorithmData } from '@/infrastructure/persistence/strapi/StrapiApiResponse';

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
    ({ Title: tData, Body: bData, criterion: critData, next: nextData }) => {
      let criterion: Criterion = new NoCriterion();

      if (critData?.Type === 'GreaterThan') {
        criterion = new GreaterThanCriterion(critData.Value);
      } else if (critData?.Type === 'LessThan') {
        criterion = new LessThanCriterion(critData?.Value);
      }

      const next = nextData.data
        ? new AlgorithmId(nextData.data.id.toString(10))
        : undefined;

      return new Outcome({ title: tData, body: bData, criterion, next });
    }
  );

  let thumbnail = defaultThumbnail;
  if (attributes.Thumbnail.data !== null) {
    thumbnail = new Image(
      strapiHostUrl + attributes.Thumbnail.data.attributes.url
    );
  }

  const citations = citationData.map((c) => new Citation(c.Citation));

  const info = new AlgorithmInfo({
    id: new AlgorithmId(algoId.toString()),
    title: Title,
    summary: Summary,
    body: Body,
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
        label: Label,
        description: Description ?? undefined,
        levels: levels.map(
          (l) => new Level(new LevelId(l.id.toString()), l.Label, l.Value)
        ),
      })
  );

  return new ScoredAlgorithm({ info, switches });
};
