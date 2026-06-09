import React, { useCallback } from 'react';
import type { ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet } from 'react-native';
import type {
  Algorithm,
  AlgorithmId,
  RenderedAlgorithm,
} from '@/domain/models/Algorithm';
import { theme } from '@/view/theme';
import { AlgorithmCollectionItem } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollectionItem';
import { useAlgorithmCollection } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/useAlgorithmCollection';
import type { AlgorithmIdWithUuid } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollection';
import { useScrollBehavior } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/useScrollBehavior';
import type { ArticleId } from '@/domain/models/Article';
import type { TreatmentStep } from '@/view/lib/TreatmentTrail';

type Props = {
  width: number;
  minHeight: number;
  renderAlgorithm: (a: Algorithm) => Promise<RenderedAlgorithm>;
  renderAlgorithmById: (
    id: AlgorithmId,
    onStale: (id: RenderedAlgorithm) => void
  ) => Promise<RenderedAlgorithm>;
  onPressArticleLink: (id: ArticleId) => void;
  onPressExternalLink: (url: string) => void;
  onRecordStep: (step: TreatmentStep) => void;
  onReachSummary: () => void;
  initialId: AlgorithmId;
};

function BaseAlgorithmCollectionView({
  width,
  minHeight,
  renderAlgorithmById,
  renderAlgorithm,
  onPressArticleLink,
  onPressExternalLink,
  onRecordStep,
  onReachSummary,
  initialId,
}: Props) {
  const { scrollToEnd, flatList, handleScroll } = useScrollBehavior();

  const {
    collection,
    handleAppendToCollection,
    handleDropItemsFromCollectionAfter,
  } = useAlgorithmCollection(initialId, scrollToEnd);

  const noop = useCallback(() => {}, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AlgorithmIdWithUuid>) => (
      <AlgorithmCollectionItem
        key={item.uuid}
        id={item.id}
        uuid={item.uuid}
        width={width}
        style={[
          styles.algorithm,
          collection.length - 1 === index && { minHeight },
        ]}
        renderAlgorithm={renderAlgorithm}
        renderAlgorithmById={renderAlgorithmById}
        appendToCollection={handleAppendToCollection}
        dropItemsFromCollectionAfter={handleDropItemsFromCollectionAfter}
        onPressArticleLink={onPressArticleLink}
        onPressExternalLink={onPressExternalLink}
        onRecordStep={onRecordStep}
        onReachSummary={onReachSummary}
        onFirstLayout={index !== 0 ? scrollToEnd : noop}
      />
    ),
    [
      width,
      collection.length,
      minHeight,
      renderAlgorithm,
      renderAlgorithmById,
      handleAppendToCollection,
      handleDropItemsFromCollectionAfter,
      onPressArticleLink,
      onPressExternalLink,
      onRecordStep,
      onReachSummary,
      scrollToEnd,
      noop,
    ]
  );

  const getListItemKey = useCallback(
    (item: AlgorithmIdWithUuid) => item.uuid,
    []
  );

  return (
    <FlatList
      data={collection.getIds()}
      renderItem={renderItem}
      keyExtractor={getListItemKey}
      ref={flatList}
      onScroll={handleScroll}
      scrollEventThrottle={300}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
    />
  );
}

const styles = StyleSheet.create({
  algorithm: {
    marginBottom: theme.spaces.lg,
  },
});

export const AlgorithmCollectionView = React.memo(BaseAlgorithmCollectionView);
