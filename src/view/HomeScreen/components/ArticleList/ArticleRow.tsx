import React, { useCallback } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { theme } from '@/view/theme';
import { Card } from '@/view/components';
import type { ArticleId } from '@/domain/models/Article';

type ArticleRowProps = {
  id: ArticleId;
  title: string;
  subtitle: string;
  imageUri: string;
  tag?: string;
  onSelectArticle: (id: ArticleId) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * "Article card" from the redesign mockup: a 21:9 thumbnail, a brand-coloured
 * uppercase tag, a 2-line title, a 2-line description clamp, and a "Read →"
 * affordance pinned to the bottom of the card body.
 */
function ArticleRow({
  id,
  title,
  imageUri,
  subtitle,
  tag = undefined,
  onSelectArticle,
  style = {},
}: ArticleRowProps) {
  const handleSelectArticle = useCallback(
    () => onSelectArticle(id),
    [id, onSelectArticle]
  );

  return (
    <Card onPress={handleSelectArticle} style={[styles.card, style]}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.tag} numberOfLines={1}>
          {(tag ?? 'Article').toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {subtitle}
        </Text>
        <Text style={styles.read}>Read →</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 21 / 9,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border2,
  },
  body: {
    flex: 1,
    padding: theme.spaces.md,
  },
  tag: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.66,
    color: theme.colors.brand,
    marginBottom: theme.spaces.sm,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.ink,
  },
  description: {
    marginTop: theme.spaces.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.ink2,
  },
  read: {
    marginTop: theme.spaces.sm,
    paddingTop: theme.spaces.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.ink3,
  },
});

export { ArticleRow };
