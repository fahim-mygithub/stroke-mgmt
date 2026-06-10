import { thrownToString } from '@/view/error-handling/thrownToString';
import { theme } from '@/view/theme';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View, Platform } from 'react-native';

type Props = {
  error: unknown;
  message?: string;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_MESSAGE =
  'Please restart the app and try again. If there is internet, refreshing or clearing the cache might help.';

function ComponentErrorView({
  error,
  message = DEFAULT_MESSAGE,
  style = {},
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.heading}>Something went wrong...</Text>
      <View style={styles.errorTextContainer}>
        <Text style={styles.errorText}>{thrownToString(error)}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 28,
    padding: theme.spaces.md,
  },
  heading: {
    color: theme.colors.onErrorContainer,
    ...theme.fonts.bodyLarge,
  },
  message: {
    color: theme.colors.onErrorContainer,
    ...theme.fonts.bodyMedium,
  },
  errorTextContainer: {
    marginLeft: theme.spaces.md,
    overflow: 'hidden',
    flex: 1,
  },
  errorText: {
    color: theme.colors.onErrorContainer,
    ...theme.fonts.bodyMedium,
    // keep error output monospaced (override the scale's Inter family)
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
  },
});

export { ComponentErrorView };
