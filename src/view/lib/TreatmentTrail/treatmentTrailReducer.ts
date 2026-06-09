// Ephemeral view-layer record of the path a clinician took through the algorithm
// flow, used to render the treatment summary + PDF handoff. This is presentation
// session state, not domain truth — it is not persisted and has no invariants
// beyond ordering, so it lives in the view layer.

export type TreatmentStep = {
  algorithmId: string;
  algorithmTitle: string;
  outcomeId: string | null;
  outcomeTitle: string | null;
  score: number | null;
};

export type TreatmentTrailState = {
  steps: TreatmentStep[];
};

export type TreatmentTrailAction =
  | { type: 'recordChoice'; step: TreatmentStep }
  | { type: 'reset' };

export const initialTreatmentTrailState: TreatmentTrailState = { steps: [] };

/**
 * Records the outcome chosen at a given algorithm. If the algorithm is already in
 * the trail (the user went back and chose differently), everything downstream of
 * it is dropped before the new choice is recorded — mirroring how the algorithm
 * collection truncates on revisit.
 */
export function treatmentTrailReducer(
  state: TreatmentTrailState,
  action: TreatmentTrailAction
): TreatmentTrailState {
  switch (action.type) {
    case 'reset':
      return initialTreatmentTrailState;
    case 'recordChoice': {
      const existingIndex = state.steps.findIndex(
        (s) => s.algorithmId === action.step.algorithmId
      );
      const kept =
        existingIndex === -1
          ? state.steps
          : state.steps.slice(0, existingIndex);
      return { steps: [...kept, action.step] };
    }
    default:
      return state;
  }
}
