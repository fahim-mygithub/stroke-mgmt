import React, { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import type { AppNavigationProps } from '@/view/Router';
import type { RenderAlgorithmByIdAction } from '@/application/RenderAlgorithmByIdAction';
import type { RenderAlgorithmAction } from '@/application/RenderAlgorithmAction';
import { AlgorithmCollectionView } from '@/view/AlgorithmViewerScreen/components/AlgorithmCollectionView/AlgorithmCollectionView';
import type { ArticleId } from '@/domain/models/Article';
import { useTreatmentTrail, type TreatmentStep } from '@/view/lib/TreatmentTrail';

function factory(
  renderAlgorithmByIdAction: RenderAlgorithmByIdAction,
  renderAlgorithmAction: RenderAlgorithmAction
) {
  return function AlgorithmViewerScreen({
    route,
    navigation,
  }: AppNavigationProps<'AlgorithmViewerScreen'>) {
    const { id } = route.params;

    const { width } = useWindowDimensions();
    const [height, setHeight] = useState(0);

    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height - 20),
      []
    );

    const onPressArticleLink = useCallback(
      (aid: ArticleId) => {
        navigation.navigate('ArticleViewerScreen', { id: aid });
      },
      [navigation]
    );

    const onPressExternalLink = useCallback(
      (url: string) => navigation.navigate('ExternalLinkModal', { url }),
      [navigation]
    );

    const { recordChoice } = useTreatmentTrail();

    const onRecordStep = useCallback(
      (step: TreatmentStep) => recordChoice(step),
      [recordChoice]
    );

    const onReachSummary = useCallback(
      () => navigation.navigate('TreatmentSummaryScreen'),
      [navigation]
    );

    return (
      <View style={styles.container} onLayout={handleLayout}>
        <AlgorithmCollectionView
          width={width}
          initialId={id}
          renderAlgorithm={useCallback(
            (a) => renderAlgorithmAction.execute(a),
            []
          )}
          renderAlgorithmById={useCallback(
            (aId, cb) => renderAlgorithmByIdAction.execute(aId, cb),
            []
          )}
          minHeight={height}
          onPressArticleLink={onPressArticleLink}
          onPressExternalLink={onPressExternalLink}
          onRecordStep={onRecordStep}
          onReachSummary={onReachSummary}
        />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

factory.$inject = ['renderAlgorithmByIdAction', 'renderAlgorithmAction'];

export { factory };
export type Type = ReturnType<typeof factory>;
