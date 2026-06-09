import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { theme } from '@/view/theme';
import { Card } from '@/view/components';

type AlgorithmItemProps = {
  id: string;
  name: string;
  body: string;
  imageUri: string;
  outcomeCount?: number;
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Pathway card" from the redesign mockup: a 16:9 thumbnail on top, then a body
 * (padding 20) with the title, a one-line summary, an arrow glyph pinned to the
 * top-right, and a meta footer showing the outcome count.
 */
function AlgorithmItem({
  id,
  name,
  body,
  imageUri,
  outcomeCount = undefined,
  onPress,
  style = {},
}: AlgorithmItemProps) {
  const hasMeta = typeof outcomeCount === 'number';

  return (
    <Card onPress={useCallback(() => onPress(id), [onPress, id])} style={style}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.arrow}>
          <FontAwesome5
            name="arrow-right"
            size={16}
            color={theme.colors.ink3}
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {body}
        </Text>
        {hasMeta && (
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              {outcomeCount} outcome{outcomeCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  body: {
    padding: 20,
    position: 'relative',
  },
  arrow: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.fonts.cardTitle,
    color: theme.colors.ink,
    paddingRight: 36,
    marginBottom: 6,
  },
  summary: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.ink2,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border2,
  },
  metaText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.ink3,
  },
});

export { AlgorithmItem };
