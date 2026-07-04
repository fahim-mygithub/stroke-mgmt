import React, { useCallback, useState } from 'react';
import type { LayoutChangeEvent, ListRenderItemInfo } from 'react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import type {
  Algorithm,
  AlgorithmId,
  RenderedAlgorithm,
} from '@/domain/models/Algorithm';
import { theme } from '@/view/theme';
import { AlgorithmBreadcrumbs } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmBreadcrumbs';
import { AlgorithmCollectionItem } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollectionItem';
import { useAlgorithmCollection } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/useAlgorithmCollection';
import type { AlgorithmIdWithUuid } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollection';
import { useScrollBehavior } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/useScrollBehavior';
import type { ArticleId } from '@/domain/models/Article';
import type { TreatmentStep } from '@/view/lib/TreatmentTrail';

type Props = {
  width: number;
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
  renderAlgorithmById,
  renderAlgorithm,
  onPressArticleLink,
  onPressExternalLink,
  onRecordStep,
  onReachSummary,
  initialId,
}: Props) {
  const {
    scrollToEnd,
    scrollToIndex,
    handleScrollToIndexFailed,
    flatList,
    handleScroll,
  } = useScrollBehavior();

  // The newest item stretches to roughly fill the list viewport so that the
  // auto scrollToEnd pins its top at the top of the screen. Measure the
  // FlatList itself, not the screen container — the breadcrumb bar above the
  // list takes ~42px of the container, and using the container height would
  // leave the top of every appended algorithm clipped by that amount.
  const [minHeight, setMinHeight] = useState(0);
  const handleListLayout = useCallback(
    (e: LayoutChangeEvent) => setMinHeight(e.nativeEvent.layout.height - 20),
    []
  );

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
    <View style={styles.container}>
      <AlgorithmBreadcrumbs
        items={collection.getIds()}
        onPressCrumb={scrollToIndex}
      />
      <FlatList
        data={collection.getIds()}
        renderItem={renderItem}
        keyExtractor={getListItemKey}
        ref={flatList}
        onLayout={handleListLayout}
        onScroll={handleScroll}
        scrollEventThrottle={300}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        onScrollToIndexFailed={handleScrollToIndexFailed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  algorithm: {
    marginBottom: theme.spaces.lg,
  },
});

export const AlgorithmCollectionView = React.memo(BaseAlgorithmCollectionView);
