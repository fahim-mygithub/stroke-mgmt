import React, { useCallback } from 'react';
import { StyleSheet, ScrollView, View, useWindowDimensions } from 'react-native';
import { AlgorithmId } from '@/domain/models/Algorithm';
import type { Algorithm } from '@/domain/models/Algorithm';
import { theme } from '@/view/theme';
import { AlgorithmItem } from '@/view/HomeScreen/components/AlgorithmList/AlgorithmItem';

type Props = {
  data: Algorithm[];
  onSelectAlgorithm: (id: AlgorithmId) => void;
};

function getOutcomeCount(algorithm: Algorithm): number | undefined {
  try {
    const outcomes = algorithm.getOutcomes();
    return Array.isArray(outcomes) ? outcomes.length : undefined;
  } catch {
    return undefined;
  }
}

function AlgorithmListFilled({ data, onSelectAlgorithm }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= theme.breakpoints.width.tablet;

  const handleSelectAlgorithm = useCallback(
    (id: string) => {
      const algorithmId = new AlgorithmId(id);
      onSelectAlgorithm(algorithmId);
    },
    [onSelectAlgorithm]
  );

  const items = data.map((algorithm) => (
    <AlgorithmItem
      id={algorithm.getId().toString()}
      name={algorithm.getTitle()}
      key={algorithm.getId().toString()}
      body={algorithm.getSummary()}
      imageUri={algorithm.getThumbnail().getUri()}
      outcomeCount={getOutcomeCount(algorithm)}
      onPress={handleSelectAlgorithm}
      style={isTablet ? styles.gridItem : styles.carouselItem}
    />
  ));

  if (isTablet) {
    return <View style={styles.grid}>{items}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
      contentContainerStyle={styles.carouselContent}
    >
      {items}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginTop: theme.spaces.md,
    // bleed slightly so the cards can scroll edge-to-edge
    marginLeft: -theme.spaces.md,
    marginRight: -theme.spaces.md,
  },
  carouselContent: {
    paddingHorizontal: theme.spaces.md,
  },
  carouselItem: {
    width: 280,
    marginRight: theme.spaces.sm + theme.spaces.xs,
  },
  grid: {
    marginTop: theme.spaces.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spaces.sm / 2,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: '50%',
    marginHorizontal: theme.spaces.sm / 2,
    marginBottom: theme.spaces.sm + theme.spaces.xs,
  },
});

export { AlgorithmListFilled };
