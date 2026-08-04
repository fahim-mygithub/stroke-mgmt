import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/view/theme';

type IconButtonProps = {
  iconName: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle | TextStyle>;
  disabled?: boolean;
  // 'bare' keeps the original 48px touch target (default, used app-wide);
  // 'boxed' is the redesign's 36px bordered square (top-bar search/kebab).
  variant?: 'bare' | 'boxed';
  // An icon-only control is unlabelled to a screen reader without this.
  accessibilityLabel?: string;
};

function IconButton({
  iconName,
  onPress,
  style = {},
  iconStyle = {},
  disabled = false,
  variant = 'bare',
  accessibilityLabel = undefined,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        variant === 'boxed' ? styles.boxed : styles.iconButton,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome5
        name={iconName}
        size={variant === 'boxed' ? 16 : 24}
        style={[styles.icon, disabled && styles.disabled, iconStyle]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  icon: {
    color: theme.colors.onSurface,
  },
  iconButton: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxed: {
    height: 36,
    width: 36,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    color: theme.colors.opacity(0.2).onSurface,
  },
});

export { IconButton };
