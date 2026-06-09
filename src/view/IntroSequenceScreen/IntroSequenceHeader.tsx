import React, { useCallback, useContext } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { StackHeaderProps } from '@react-navigation/stack';
import type { Route } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { NoInternetBanner, useNoInternetBanner } from '@/view/NoInternetBanner';
import { theme } from '@/view/theme';
import { StatusBar } from '@/view/StatusBar';
import { TextButton } from '@/view/components';
import { HeaderScrollContext } from '@/view/Router/HeaderScrollContext';
import { hideIntroSequence } from '@/view/lib/shouldShowIntroSequence';
import type { IntroSequence } from '@/domain/models/IntroSequence';
import { IntroProgressDots } from '@/view/IntroSequenceScreen/IntroProgressDots';
import { clampIndex } from '@/view/IntroSequenceScreen/slideIndex';

type IntroSequenceParams = {
  cursor: number;
};

type IntroSequenceRoute = Route<string, IntroSequenceParams>;

function IntroSequenceHeader({ route, navigation }: StackHeaderProps) {
  const { shouldShowNoInternetBanner, handleDismissNoInternetBanner } =
    useNoInternetBanner();

  const { scrolledToTop } = useContext(HeaderScrollContext);
  const headerHasElevation = !scrolledToTop || shouldShowNoInternetBanner;

  if (!route || !route.params)
    throw Error('No Intro Sequence cursor provided to header');

  const sequenceCursor = (route as IntroSequenceRoute).params.cursor;

  // Observe the same query the screen populates so the dot count appears (and
  // re-renders) as soon as the intro sequence loads. `enabled: false` means we
  // never fetch here — the screen owns the fetch; we just read the shared cache.
  const { data: sequence } = useQuery<IntroSequence>({
    queryKey: ['intro-sequence'],
    enabled: false,
  });
  const slideCount = sequence ? sequence.getArticleIds().length : 0;
  const activeIndex = clampIndex(sequenceCursor, slideCount);

  const handlePressSkip = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
    hideIntroSequence();
  }, [navigation]);

  return (
    <View
      style={[styles.container, headerHasElevation && styles.containerElevated]}
    >
      <StatusBar textColor="auto" />
      <View style={styles.header}>
        <View style={styles.progress}>
          <IntroProgressDots count={slideCount} activeIndex={activeIndex} />
          {slideCount > 0 && (
            <Text style={styles.counter} allowFontScaling={false}>
              {activeIndex + 1} of {slideCount}
            </Text>
          )}
        </View>
        <TextButton
          title="Skip"
          onPress={handlePressSkip}
          textColor={theme.colors.ink3}
          style={styles.skipButton}
        />
      </View>
      <NoInternetBanner
        onPressDismiss={handleDismissNoInternetBanner}
        visible={shouldShowNoInternetBanner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.colors.surface,
  },
  containerElevated: {
    ...theme.elevations[1],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: theme.spaces.md,
    paddingRight: theme.spaces.xs,
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  counter: {
    ...theme.fonts.labelLarge,
    fontSize: 12,
    color: theme.colors.ink3,
    marginLeft: theme.spaces.sm,
  },
  skipButton: {
    height: 40,
  },
});

export { IntroSequenceHeader };
