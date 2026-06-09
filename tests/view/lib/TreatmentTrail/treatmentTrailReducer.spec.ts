import {
  treatmentTrailReducer,
  initialTreatmentTrailState,
  type TreatmentStep,
} from '@/view/lib/TreatmentTrail/treatmentTrailReducer';

const step = (
  algorithmId: string,
  outcomeId: string,
  score: number | null = null
): TreatmentStep => ({
  algorithmId,
  algorithmTitle: `Algo ${algorithmId}`,
  outcomeId,
  outcomeTitle: `Outcome ${outcomeId}`,
  score,
});

describe('treatmentTrailReducer', () => {
  it('starts empty', () => {
    expect(initialTreatmentTrailState.steps).toEqual([]);
  });

  it('appends a recorded choice', () => {
    const s = treatmentTrailReducer(initialTreatmentTrailState, {
      type: 'recordChoice',
      step: step('a', 'o1'),
    });
    expect(s.steps).toHaveLength(1);
    expect(s.steps[0].algorithmId).toBe('a');
    expect(s.steps[0].outcomeId).toBe('o1');
  });

  it('appends subsequent distinct algorithms in order', () => {
    let s = treatmentTrailReducer(initialTreatmentTrailState, {
      type: 'recordChoice',
      step: step('a', 'o1'),
    });
    s = treatmentTrailReducer(s, { type: 'recordChoice', step: step('b', 'o2') });
    expect(s.steps.map((x) => x.algorithmId)).toEqual(['a', 'b']);
  });

  it('truncates downstream steps when an earlier algorithm is revisited', () => {
    let s = initialTreatmentTrailState;
    s = treatmentTrailReducer(s, { type: 'recordChoice', step: step('a', 'o1') });
    s = treatmentTrailReducer(s, { type: 'recordChoice', step: step('b', 'o2') });
    s = treatmentTrailReducer(s, { type: 'recordChoice', step: step('c', 'o3') });
    // revisit 'a' with a different outcome -> b and c drop, new a choice recorded
    s = treatmentTrailReducer(s, { type: 'recordChoice', step: step('a', 'o9') });
    expect(s.steps.map((x) => x.algorithmId)).toEqual(['a']);
    expect(s.steps[0].outcomeId).toBe('o9');
  });

  it('preserves score values', () => {
    const s = treatmentTrailReducer(initialTreatmentTrailState, {
      type: 'recordChoice',
      step: step('a', 'o1', 7),
    });
    expect(s.steps[0].score).toBe(7);
  });

  it('resets to empty', () => {
    let s = treatmentTrailReducer(initialTreatmentTrailState, {
      type: 'recordChoice',
      step: step('a', 'o1'),
    });
    s = treatmentTrailReducer(s, { type: 'reset' });
    expect(s.steps).toEqual([]);
  });
});
