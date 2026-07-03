import type { Criterion, Outcome } from '@/domain/models/Algorithm';
import { CRITERION_TYPES } from '@/domain/models/Algorithm';
import type {
  CriterionData,
  OutcomeData,
} from '@/infrastructure/persistence/websql/WebsqlCachedAlgorithmRepository/tableSchema';

function extractCriterionData(criterion: Criterion): CriterionData {
  if (criterion.type !== CRITERION_TYPES.NO_CRITERION) {
    return {
      type: criterion.type,
      threshold: criterion.getThreshold(),
    };
  }
  return {
    type: criterion.type,
    threshold: null,
  };
}

function extractOutcomeData(outcome: Outcome): OutcomeData {
  return {
    title: outcome.getTitle(),
    body: outcome.getBody(),
    criterion: extractCriterionData(outcome.getCriterion()),
    next: outcome.getNext()?.toString() ?? null,
    terminalBehavior: outcome.getTerminalBehavior(),
  };
}

function serializeOutcomes(outcomes: Outcome[]) {
  const outcomeData = outcomes.map(extractOutcomeData);
  return JSON.stringify(outcomeData);
}

export { serializeOutcomes };
