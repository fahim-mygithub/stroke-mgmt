import React, { useCallback } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { theme } from '@/view/theme';
import { MenuItem } from '@/view/Router/MenuItem';
import type { RootNavigationProps } from '@/view/Router/Router';
import { useQueryClient } from '@tanstack/react-query';
import type { ClearCacheAction } from '@/application/ClearCacheAction';
import { useShowSnack } from '@/view/Snackbar/useShowSnack';

type Props = RootNavigationProps<'HeaderMenuModal'>;

function factory(clearCacheAction: ClearCacheAction) {
  return function Menu({ navigation, route }: Props) {
    const { translateY } = route.params;

    const handlePressDisclaimer = useCallback(() => {
      navigation.replace('DisclaimerModal');
    }, [navigation]);

    const showSnack = useShowSnack();

    const queryClient = useQueryClient();
    const refreshQueries = useCallback(() => {
      queryClient.invalidateQueries({
        refetchType: 'all',
      });
    }, [queryClient]);

    const handlePressRefresh = useCallback(() => {
      refreshQueries();
      navigation.goBack();
    }, [navigation, refreshQueries]);

    const handlePressClearCache = useCallback(() => {
      clearCacheAction
        .execute()
        .then(() =>
          showSnack({
            message: 'Cleared. Please refresh or restart.',
            dwellMilliseconds: 3000,
            action: {
              label: 'Refresh',
              onPress: refreshQueries,
            },
          })
        )
        .then(() => {
          navigation.goBack();
        });
    }, [navigation, refreshQueries, showSnack]);

    const handlePressAbout = useCallback(() => {
      navigation.navigate('AboutUsScreen');
    }, [navigation]);

    const handlePressLicense = useCallback(() => {
      navigation.navigate('LicenseScreen');
    }, [navigation]);

    const handlePressIntro = useCallback(() => {
      navigation.navigate('IntroSequenceScreen', { cursor: 0 });
    }, [navigation]);

    const handleRequestDismiss = useCallback(() => {
      navigation.goBack();
    }, [navigation]);

    return (
      <View style={styles.contentContainer}>
        <TouchableWithoutFeedback onPress={handleRequestDismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.menu, { transform: [{ translateY }] }]}>
          <View style={styles.content}>
            <MenuItem onPress={handlePressIntro}>Intro</MenuItem>
            <MenuItem onPress={handlePressDisclaimer}>Disclaimer</MenuItem>
            <MenuItem onPress={handlePressLicense}>License</MenuItem>
            <MenuItem onPress={handlePressRefresh}>Refresh</MenuItem>
            <MenuItem onPress={handlePressClearCache}>Clear Cache</MenuItem>
            <MenuItem onPress={handlePressAbout}>About</MenuItem>
          </View>
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  backdrop: {
    height: '100%',
    width: '100%',
  },
  menu: {
    minWidth: 200,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    right: theme.spaces.md,
    zIndex: 2,
    ...theme.elevations.lg,
  },
  menuInvisible: { display: 'none' },
  menuVisible: { display: 'flex' },
  content: {
    padding: theme.spaces.xs + 2,
    gap: 1,
  },
});

factory.$inject = ['clearCacheAction'];

export { factory };
export type Type = ReturnType<typeof factory>;
