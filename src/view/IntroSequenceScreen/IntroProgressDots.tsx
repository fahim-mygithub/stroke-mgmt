import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '@/view/theme';

type Props = {
  count: number;
  activeIndex: number;
};

// Dot progress indicator mirroring the mockup's .intro-dots:
// active dot = brand + larger, done dots = brand faded, upcoming = border.
function IntroProgressDots({ count, activeIndex }: Props) {
  if (count <= 0) return null;
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            style={[
              styles.dot,
              isDone && styles.dotDone,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: theme.colors.border,
  },
  dotDone: {
    backgroundColor: theme.colors.brand,
    opacity: 0.55,
  },
  dotActive: {
    backgroundColor: theme.colors.brand,
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 1,
  },
});

export { IntroProgressDots };
