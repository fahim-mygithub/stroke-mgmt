import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Tag } from '@/domain/models/Tag';
import { TagItem } from '@/view/HomeScreen/components/TagList/TagItem';
import { theme } from '@/view/theme';

type TagState = {
  tag: Tag;
  active: boolean;
};

type Props = {
  tags: TagState[];
  onToggle: (v: Tag) => void;
};

function TagList({ tags, onToggle }: Props) {
  const tagItems = useMemo(
    () =>
      tags.map((t) => (
        <TagItem
          tag={t.tag}
          key={t.tag.getName()}
          onPress={onToggle}
          active={t.active}
          style={styles.tag}
        />
      )),
    [onToggle, tags]
  );

  return <View style={styles.container}>{tagItems}</View>;
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: theme.spaces.md,
    marginBottom: theme.spaces.xs,
  },
  tag: {
    marginRight: theme.spaces.sm,
    marginTop: theme.spaces.sm,
  },
});

export { TagList };
export type { TagState };
