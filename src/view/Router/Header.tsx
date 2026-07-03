import React, { useCallback, useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getHeaderTitle } from '@react-navigation/elements';
import type { StackHeaderProps } from '@react-navigation/stack';
import { NoInternetBanner, useNoInternetBanner } from '@/view/NoInternetBanner';
import { HeaderScrollContext } from '@/view/Router/HeaderScrollContext';
import { StatusBar } from '@/view/StatusBar';
import { IconButton } from '@/view/components';
import { theme } from '@/view/theme';
import {
  useHowToOpenMenuBanner,
  HowToOpenMenuBanner,
} from '@/view/HowToOpenMenuBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = StackHeaderProps;

const HEADER_HEIGHT = 64;

function Header({ navigation, route, options, back }: Props) {
  const title = getHeaderTitle(options, route.name);

  const { top: statusBarHeight } = useSafeAreaInsets();

  const handleMenuPress = useCallback(() => {
    navigation.navigate('HeaderMenuModal', {
      translateY: HEADER_HEIGHT + statusBarHeight,
    });
  }, [navigation, statusBarHeight]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('SearchModal');
  }, [navigation]);

  const { shouldShowNoInternetBanner, handleDismissNoInternetBanner } =
    useNoInternetBanner();

  const {
    shouldShowHowToOpenMenuBanner: shouldShowMenuBeforeOr,
    handleDismissHowToOpenMenuBanner,
  } = useHowToOpenMenuBanner();
  const shouldShowHowToOpenMenuBanner =
    shouldShowMenuBeforeOr && !shouldShowNoInternetBanner;

  const { scrolledToTop } = useContext(HeaderScrollContext);
  const headerHasElevation =
    !scrolledToTop ||
    shouldShowNoInternetBanner ||
    shouldShowHowToOpenMenuBanner;

  return (
    <View
      style={[styles.container, headerHasElevation && styles.containerElevated]}
    >
      <StatusBar textColor="auto" />
      <View style={styles.header}>
        <View style={styles.leading}>
          {back ? (
            <IconButton
              iconName="arrow-left"
              onPress={handleBack}
              style={styles.backButton}
            />
          ) : (
            <Text style={styles.brand} numberOfLines={1}>
              Ischemic Stroke
            </Text>
          )}
          {/* When a back action exists the route title takes the brand slot,
              restyled as the mockup's compact top-bar title. */}
          {back && !!title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
        <View style={styles.trailingIconGroup}>
          <IconButton
            variant="boxed"
            iconName="search"
            onPress={handleSearchPress}
            iconStyle={styles.trailingIcon}
          />
          <IconButton
            variant="boxed"
            iconName="ellipsis-v"
            onPress={handleMenuPress}
            iconStyle={styles.trailingIcon}
            style={styles.trailingIconSpacing}
          />
        </View>
      </View>
      <NoInternetBanner
        visible={shouldShowNoInternetBanner}
        onPressDismiss={handleDismissNoInternetBanner}
      />
      <HowToOpenMenuBanner
        visible={shouldShowHowToOpenMenuBanner}
        onPressDismiss={handleDismissHowToOpenMenuBanner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  containerElevated: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: 'transparent',
    ...theme.elevations.sm,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spaces.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  brand: {
    ...theme.fonts.titleMedium,
    fontFamily: theme.fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  title: {
    ...theme.fonts.titleMedium,
    fontFamily: theme.fontFamily.semibold,
    fontWeight: '600',
    fontSize: 15,
    color: theme.colors.ink,
    flexShrink: 1,
    marginLeft: theme.spaces.sm,
  },
  backButton: {
    marginLeft: -theme.spaces.sm,
  },
  trailingIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailingIconSpacing: {
    marginLeft: theme.spaces.sm,
  },
  trailingIcon: {
    color: theme.colors.ink2,
  },
});

export { Header };
