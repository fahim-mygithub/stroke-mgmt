import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '@/view/theme';

type PillProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tag-filter chip from the redesign. Default = bordered with ink-2 text;
 * active = solid ink fill with white text.
 */
function Pill({ label, active = false, onPress, style = undefined }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active ? styles.pillActive : styles.pillIdle, style]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  label: {
    ...theme.fonts.labelLarge,
    fontSize: 13,
  },
  labelIdle: {
    color: theme.colors.ink2,
  },
  labelActive: {
    color: '#ffffff',
  },
});

export { Pill };
