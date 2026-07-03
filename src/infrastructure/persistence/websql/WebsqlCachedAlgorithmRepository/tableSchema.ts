import type { AlgorithmType, CriterionType } from '@/domain/models/Algorithm';

export type CachedAlgorithmRow = {
  id: string;
  title: string;
  summary: string;
  body: string;
  thumbnailUri: string;
  outcomesJson: string;
  shouldShowOnHomeScreen: 0 | 1;
  lastUpdatedTimestamp: number;
  switchesJson: string;
  citationsJson: string;
  type: AlgorithmType;
};

export type CriterionData =
  | {
      type: Exclude<CriterionType, 'NoCriterion'>;
      threshold: number;
    }
  | {
      type: 'NoCriterion';
      threshold: null;
    };

export type OutcomeData = {
  title: string;
  body: string;
  criterion: CriterionData;
  next: string | null;
  // Optional so rows cached before the field existed still parse.
  terminalBehavior?: 'Complete' | 'Halt';
};

export type OutcomesJson = OutcomeData[];

export type LevelData = {
  id: string;
  label: string;
  value: number;
};

export type SwitchData = {
  id: string;
  label: string;
  levels: LevelData[];
  description: string | null;
};

export type SwitchesJson = SwitchData[];

export type CitationsJson = { value: string }[];
