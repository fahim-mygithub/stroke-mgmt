import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { theme } from '@/view/theme';

type EyebrowProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
};

/** Uppercase section eyebrow label (e.g. "TREATMENT ALGORITHMS"). */
function Eyebrow({ children, style = undefined }: EyebrowProps) {
  return (
    <Text style={[styles.eyebrow, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...theme.fonts.eyebrow,
    color: theme.colors.ink3,
    textTransform: 'uppercase',
  },
});

export { Eyebrow };
