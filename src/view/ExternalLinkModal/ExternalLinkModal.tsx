import React, { useCallback, useEffect, useRef } from 'react';
import type { AppStateStatus } from 'react-native';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';
import { openURL as expoLinkingOpenUrl } from 'expo-linking';
import type { RootNavigationProps } from '@/view/Router';
import { theme } from '@/view/theme';
import { Button, TextButton } from '@/view/components';

function openUrl(urlInput: string) {
  let url = urlInput;
  if (!url.match(/^https?:/)) url = `https://${url}`;
  expoLinkingOpenUrl(url);
}

function isFocusing(oldAppState: AppStateStatus, newAppState: AppStateStatus) {
  const isNowActive = newAppState === 'active';
  const wasBackgrounded =
    oldAppState === 'inactive' || oldAppState === 'background';
  return wasBackgrounded && isNowActive;
}

function ExternalLinkModal({
  route,
  navigation,
}: RootNavigationProps<'ExternalLinkModal'>) {
  const handleDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const { url } = route.params;

  const handleOpenLink = useCallback(() => {
    openUrl(url);
  }, [url]);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (newAppState) => {
      const oldAppState = appState.current;
      if (isFocusing(oldAppState, newAppState)) {
        handleDismiss();
      }
      appState.current = newAppState;
    });
    return () => subscription.remove();
  }, [handleDismiss]);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.background} />
      </TouchableWithoutFeedback>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>External Link</Text>
        <Text style={styles.subtitle}>
          You are navigating to an external webpage. You may have to open the
          app again to come back!
        </Text>
        <Text style={styles.url} numberOfLines={2}>
          {url}
        </Text>
        <View style={styles.buttonGroup}>
          <TextButton
            title="Cancel"
            onPress={handleDismiss}
            textColor={theme.colors.ink2}
            style={styles.btnSecondary}
          />
          <Button title="Open Link" onPress={handleOpenLink} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spaces.md,
  },
  background: {
    backgroundColor: theme.colors.ink,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  contentContainer: {
    backgroundColor: theme.colors.surface,
    ...theme.elevations.lg,
    padding: theme.spaces.lg,
    width: '100%',
    minWidth: 280,
    maxWidth: 480,
    borderRadius: theme.radii.lg,
  },
  buttonGroup: {
    marginTop: theme.spaces.lg,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: theme.spaces.sm,
  },
  btnSecondary: {
    alignSelf: 'center',
  },
  title: {
    ...theme.fonts.titleLarge,
    color: theme.colors.ink,
  },
  subtitle: {
    ...theme.fonts.bodyMedium,
    color: theme.colors.ink2,
    marginTop: theme.spaces.sm,
  },
  url: {
    ...theme.fonts.bodyMedium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.brand,
    marginTop: theme.spaces.sm,
  },
});

export { ExternalLinkModal };
