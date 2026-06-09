import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '@/view/theme';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Surface card from the redesign: white surface, 1px border, lg radius, soft
 * shadow. When pressable it lifts (stronger shadow) and dips slightly on press.
 */
function Card({ children, onPress = undefined, style = undefined }: CardProps) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    ...theme.elevations.xs,
  },
  pressed: {
    transform: [{ scale: 0.995 }],
    ...theme.elevations.md,
  },
});

export { Card };
