import { theme } from '@/view/theme';
import React from 'react';
import { TouchableHighlight, Text, StyleSheet } from 'react-native';

type Props = {
  children: string;
  onPress: () => void;
};

function MenuItem({ children, onPress }: Props) {
  return (
    <TouchableHighlight
      onPress={onPress}
      style={styles.container}
      underlayColor={theme.colors.brandSofter}
      activeOpacity={1}
    >
      <Text style={styles.label}>{children}</Text>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radii.sm,
    justifyContent: 'center',
  },
  label: {
    ...theme.fonts.labelLarge,
    fontFamily: theme.fontFamily.regular,
    fontWeight: '400',
    fontSize: 14,
    color: theme.colors.ink,
  },
});

export { MenuItem };
