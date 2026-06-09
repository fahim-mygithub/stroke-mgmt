import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { Button, Checkbox } from '@/view/components';
import { theme } from '@/view/theme';

type Props = {
  onPressNext: () => void;
  onPressPrevious: () => void;
  onChangeCheckbox: (v: boolean) => void;
  checkboxValue: boolean;
  isFirst: boolean;
  isLast: boolean;
  nextTitle?: string;
};

// Footer for the intro slideshow (mockup .intro-foot): a ghost "Previous"
// (disabled/hidden-feel on the first slide) and a brand "Next" that becomes
// "Get Started" on the last slide, where a "Don't show again" checkbox appears.
function IntroSequenceBottomBar({
  onPressNext,
  onPressPrevious,
  onChangeCheckbox,
  checkboxValue,
  isFirst,
  isLast,
  nextTitle,
}: Props) {
  const resolvedNextTitle = nextTitle ?? (isLast ? 'Get Started' : 'Next');
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLast && (
          <Checkbox
            value={checkboxValue}
            onChange={onChangeCheckbox}
            style={styles.checkbox}
            label="Don't show again"
          />
        )}
        <View style={styles.nav}>
          <Button
            title="Previous"
            onPress={isFirst ? noop : onPressPrevious}
            outlined
            backgroundColor={theme.colors.surface}
            outlineColor={isFirst ? theme.colors.border2 : theme.colors.border}
            textColor={isFirst ? theme.colors.opacity(0.35).onSurface : theme.colors.ink2}
            underlayColor={theme.colors.surfaceContainerLow}
            style={styles.prevButton}
          />
          <Button
            title={resolvedNextTitle}
            onPress={onPressNext}
            backgroundColor={theme.colors.brand}
            textColor={theme.colors.onPrimary}
            underlayColor={theme.colors.brandHover}
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function noop() {}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.surface,
    ...theme.elevations[2],
  },
  container: {
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: theme.spaces.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spaces.sm,
  },
  nav: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: theme.spaces.md,
  },
  prevButton: {
    height: 44,
    marginRight: theme.spaces.sm,
  },
  nextButton: {
    height: 44,
  },
});

export { IntroSequenceBottomBar };
