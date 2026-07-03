import {
  AlgorithmId,
  Outcome,
  GreaterThanCriterion,
  GreaterThanOrEqualToCriterion,
  LessThanCriterion,
  LessThanOrEqualToCriterion,
  NoCriterion,
  Switch,
  Level,
  LevelId,
  SwitchId,
  TextAlgorithm,
  AlgorithmInfo,
  ScoredAlgorithm,
} from '@/domain/models/Algorithm';
import { Citation } from '@/domain/models/Citation';
import { Image } from '@/domain/models/Image';
import type {
  CachedAlgorithmRow,
  CriterionData,
  LevelData,
  OutcomesJson,
  SwitchesJson,
  CitationsJson,
} from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/tableSchema';

function criterionDataToCriterion(d: CriterionData) {
  switch (d.type) {
    case 'GreaterThanCriterion':
      return new GreaterThanCriterion(d.threshold);
    case 'GreaterThanOrEqualToCriterion':
      return new GreaterThanOrEqualToCriterion(d.threshold);
    case 'LessThanCriterion':
      return new LessThanCriterion(d.threshold);
    case 'LessThanOrEqualToCriterion':
      return new LessThanOrEqualToCriterion(d.threshold);
    case 'NoCriterion':
      return new NoCriterion();
    default:
      throw Error(`Unrecognized criterion type.`);
  }
}

function outcomesJsonToOutcomes(outcomesJson: string): Outcome[] {
  const outcomeData: OutcomesJson = JSON.parse(outcomesJson);
  return outcomeData.map(
    (d) =>
      new Outcome({
        title: d.title,
        body: d.body,
        criterion: criterionDataToCriterion(d.criterion),
        next: d.next ? new AlgorithmId(d.next) : undefined,
        terminalBehavior: d.terminalBehavior,
      })
  );
}

function levelDataToLevel(l: LevelData) {
  return new Level(new LevelId(l.id), l.label, l.value);
}

function switchesJsonToSwitches(switchesJson: string): Switch[] {
  const switchesData: SwitchesJson = JSON.parse(switchesJson);
  return switchesData.map(
    (d) =>
      new Switch({
        id: new SwitchId(d.id),
        label: d.label,
        levels: d.levels.map(levelDataToLevel),
        description: d.description ?? undefined,
      })
  );
}

function citationsJsonToCitations(citationsJson: string): Citation[] {
  const citationsData: CitationsJson = JSON.parse(citationsJson);
  return citationsData.map((c) => new Citation(c.value));
}

function cachedAlgorithmRowToTextAlgorithm(row: CachedAlgorithmRow) {
  const outcomes = outcomesJsonToOutcomes(row.outcomesJson);
  const citations = citationsJsonToCitations(row.citationsJson);
  const info = new AlgorithmInfo({
    id: new AlgorithmId(row.id),
    title: row.title,
    body: row.body,
    outcomes,
    summary: row.summary,
    thumbnail: new Image(row.thumbnailUri),
    citations,
    shouldShowOnHomeScreen: row.shouldShowOnHomeScreen === 1,
    lastUpdated: new Date(row.lastUpdatedTimestamp),
  });
  return new TextAlgorithm({ info });
}

function cachedAlgorithmRowToScoredAlgorithm(row: CachedAlgorithmRow) {
  const outcomes = outcomesJsonToOutcomes(row.outcomesJson);
  const switches = switchesJsonToSwitches(row.switchesJson);
  const citations = citationsJsonToCitations(row.citationsJson);
  const info = new AlgorithmInfo({
    id: new AlgorithmId(row.id),
    title: row.title,
    body: row.body,
    outcomes,
    summary: row.summary,
    thumbnail: new Image(row.thumbnailUri),
    citations,
    shouldShowOnHomeScreen: row.shouldShowOnHomeScreen === 1,
    lastUpdated: new Date(row.lastUpdatedTimestamp),
  });
  const algo = new ScoredAlgorithm({ info, switches });
  return algo;
}

function cachedAlgorithmRowToAlgorithm(row: CachedAlgorithmRow) {
  return row.type === 'ScoredAlgorithm'
    ? cachedAlgorithmRowToScoredAlgorithm(row)
    : cachedAlgorithmRowToTextAlgorithm(row);
}

export { cachedAlgorithmRowToAlgorithm };
