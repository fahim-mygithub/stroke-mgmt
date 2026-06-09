import React, { useCallback, useEffect, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import type {
  Algorithm,
  AlgorithmId,
  RenderedAlgorithm,
} from '@/domain/models/Algorithm';
import { ScoredAlgorithm } from '@/domain/models/Algorithm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UseQueryResultView } from '@/view/lib/UseQueryResultView';
import { AlgorithmView } from '@/view/AlgorithmViewerScreen/components/AlgorithmView';
import { LoadingSpinnerView } from '@/view/components';
import type { ArticleId } from '@/domain/models/Article';
import { ScreenErrorView } from '@/view/error-handling';
import type { TreatmentStep } from '@/view/lib/TreatmentTrail';

// Sentinel id emitted by a terminal outcome's "Complete & view summary" button
// (see outcomeList.ejs). Encodes the chosen displayed-outcome index.
const FINISH_PREFIX = '__finish__:';

type Props = {
  id: AlgorithmId;
  uuid: string;
  renderAlgorithm: (a: Algorithm) => Promise<RenderedAlgorithm>;
  renderAlgorithmById: (
    id: AlgorithmId,
    onStale: (id: RenderedAlgorithm) => void
  ) => Promise<RenderedAlgorithm>;
  appendToCollection: (afterUuid: string, newId: AlgorithmId) => void;
  dropItemsFromCollectionAfter: (afterUuid: string) => void;
  width: number;
  onPressArticleLink: (id: ArticleId) => void;
  onPressExternalLink: (url: string) => void;
  onRecordStep: (step: TreatmentStep) => void;
  onReachSummary: () => void;
  onFirstLayout: () => void;
  style?: StyleProp<ViewStyle>;
};

// Resolves which outcome the user chose from the next-id the WebView reported,
// then records the step into the treatment trail. Returns true if this was a
// terminal "finish" choice (no further algorithm to append).
function recordChosenStep(
  nextId: AlgorithmId,
  algorithm: Algorithm,
  onRecordStep: (step: TreatmentStep) => void
): boolean {
  const nextIdStr = nextId.toString();
  const isFinish = nextIdStr.startsWith(FINISH_PREFIX);
  const outcomes = algorithm.getDisplayedOutcomes();

  const chosen = isFinish
    ? outcomes[Number(nextIdStr.slice(FINISH_PREFIX.length))]
    : outcomes.find((o) => String(o.getNext()) === nextIdStr);

  const score =
    algorithm instanceof ScoredAlgorithm ? algorithm.calculateScore() : null;

  onRecordStep({
    algorithmId: algorithm.getId().toString(),
    algorithmTitle: algorithm.getTitle(),
    outcomeId: isFinish ? nextIdStr : String(chosen?.getNext() ?? nextIdStr),
    outcomeTitle: chosen?.getTitle() ?? null,
    score,
  });

  return isFinish;
}

function BaseAlgorithmCollectionItem({
  id,
  uuid,
  renderAlgorithm,
  renderAlgorithmById,
  appendToCollection,
  dropItemsFromCollectionAfter,
  width,
  onPressArticleLink,
  onPressExternalLink,
  onRecordStep,
  onReachSummary,
  onFirstLayout,
  style = {},
}: Props) {
  const [renderedAlgorithm, setRenderedAlgorithm] =
    useState<RenderedAlgorithm | null>(null);
  const queryClient = useQueryClient();
  const handleStale = (rAlgo: RenderedAlgorithm) =>
    queryClient.setQueryData(['algorithm', id.toString()], rAlgo);

  const query = useQuery({
    queryKey: ['algorithm', id.toString()],
    queryFn: () => renderAlgorithmById(id, handleStale),
    structuralSharing: (oldData, newData) => {
      if (!oldData) return newData;
      const isStale =
        oldData.getAlgorithm().getLastUpdated() <
        newData.getAlgorithm().getLastUpdated();
      if (isStale) {
        // runs once after both handleStale and query's refetch
        dropItemsFromCollectionAfter(uuid);
        return newData;
      }
      return oldData;
    },
  });

  useEffect(() => {
    if (query.isSuccess) setRenderedAlgorithm(query.data);
  }, [query.data, query.isSuccess]);

  const handleChangeAlgorithm = useCallback(
    async (newAlgorithmState: Algorithm) => {
      const rAlgo = await renderAlgorithm(newAlgorithmState);
      setRenderedAlgorithm(rAlgo);
    },
    [renderAlgorithm]
  );

  const handleNextAlgorithm = useCallback(
    (nextId: AlgorithmId, thisAlgorithm: Algorithm) => {
      const isFinish = recordChosenStep(nextId, thisAlgorithm, onRecordStep);
      if (isFinish) {
        onReachSummary();
        return;
      }
      appendToCollection(uuid, nextId);
    },
    [appendToCollection, uuid, onRecordStep, onReachSummary]
  );

  return (
    <UseQueryResultView
      query={query}
      renderError={useCallback(
        (error) => (
          <View style={styles.errorView}>
            <ScreenErrorView
              error={error}
              message={`We had trouble getting this algorithm (id: ${id}). If there is internet, then refreshing or clearing the cache may help. Restarting the app might also help.`}
            />
          </View>
        ),
        [id]
      )}
      renderData={useCallback(
        () =>
          renderedAlgorithm ? (
            <AlgorithmView
              algorithm={renderedAlgorithm.getAlgorithm()}
              html={renderedAlgorithm.getHtml()}
              width={width}
              onChangeAlgorithm={handleChangeAlgorithm}
              onNextAlgorithm={handleNextAlgorithm}
              style={style}
              onPressArticleLink={onPressArticleLink}
              onPressExternalLink={onPressExternalLink}
              onFirstLayout={onFirstLayout}
            />
          ) : (
            <Text>Oh no! Something went wrong!</Text>
          ),
        [
          handleChangeAlgorithm,
          handleNextAlgorithm,
          onFirstLayout,
          onPressArticleLink,
          onPressExternalLink,
          renderedAlgorithm,
          style,
          width,
        ]
      )}
      renderLoading={useCallback(
        () => (
          <LoadingSpinnerView />
        ),
        []
      )}
    />
  );
}

const styles = StyleSheet.create({
  errorView: {
    height: 350,
  },
});

export const AlgorithmCollectionItem = React.memo(BaseAlgorithmCollectionItem);
