import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import {
  treatmentTrailReducer,
  initialTreatmentTrailState,
  type TreatmentStep,
  type TreatmentTrailState,
} from '@/view/lib/TreatmentTrail/treatmentTrailReducer';

type TreatmentTrailContextValue = {
  steps: TreatmentStep[];
  recordChoice: (step: TreatmentStep) => void;
  reset: () => void;
};

const TreatmentTrailContext = createContext<TreatmentTrailContextValue | null>(
  null
);

function TreatmentTrailProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    treatmentTrailReducer,
    initialTreatmentTrailState as TreatmentTrailState
  );

  const value = useMemo<TreatmentTrailContextValue>(
    () => ({
      steps: state.steps,
      recordChoice: (step: TreatmentStep) =>
        dispatch({ type: 'recordChoice', step }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state.steps]
  );

  return (
    <TreatmentTrailContext.Provider value={value}>
      {children}
    </TreatmentTrailContext.Provider>
  );
}

function useTreatmentTrail(): TreatmentTrailContextValue {
  const ctx = useContext(TreatmentTrailContext);
  if (!ctx) {
    throw new Error(
      'useTreatmentTrail must be used within a TreatmentTrailProvider'
    );
  }
  return ctx;
}

export { TreatmentTrailProvider, useTreatmentTrail };
