import React, { useCallback } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import { Pill } from '@/view/components';
import type { Tag } from '@/domain/models/Tag';

type Props = {
  tag: Tag;
  onPress: (v: Tag) => void;
  active: boolean;
  style?: StyleProp<ViewStyle>;
};

function TagItem({ tag, onPress, active, style = {} }: Props) {
  const handlePress = useCallback(() => onPress(tag), [onPress, tag]);

  return (
    <Pill
      label={tag.getName()}
      active={active}
      onPress={handlePress}
      style={style}
    />
  );
}

export { TagItem };
