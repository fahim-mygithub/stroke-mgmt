import React, { useCallback } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/view/theme';

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

function Checkbox({ value, onChange, label = '', style = {} }: Props) {
  const handlePress = useCallback(() => {
    onChange(!value);
  }, [onChange, value]);
  return (
    <TouchableOpacity onPress={handlePress} style={[styles.container, style]}>
      {value ? (
        <FontAwesome5 name="check-square" size={24} color={theme.colors.brand} />
      ) : (
        <FontAwesome5 name="square" size={24} color={theme.colors.ink3} />
      )}
      <Text style={styles.text} allowFontScaling={false}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: theme.spaces.sm,
  },
});

export { Checkbox };
